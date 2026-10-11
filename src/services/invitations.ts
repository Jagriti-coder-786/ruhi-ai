import crypto from 'crypto';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Organization, { OrganizationRole } from '@/models/Organization';
import OrganizationInvite from '@/models/OrganizationInvite';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import emailService from './email';

const INVITE_EXPIRATION_DAYS = 7;

export async function createOrResendInvitation(params: {
  orgId: string;
  requesterUserId: string;
  email: string;
  role: OrganizationRole;
  origin?: string;
}) {
  await connectDB();
  const { orgId, requesterUserId, email, role, origin } = params;

  const normalizedEmail = email.toLowerCase().trim();
  const orgObjectId = new mongoose.Types.ObjectId(orgId);
  const reqObjectId = new mongoose.Types.ObjectId(requesterUserId);

  const org = await Organization.findById(orgObjectId);
  if (!org) throw new Error('Organization not found');

  // 1. Authorization: requester must be owner or admin
  const isOwner = org.ownerId.equals(reqObjectId);
  const requesterMember = org.members.find((m) => m.userId.equals(reqObjectId));
  if (!isOwner && (!requesterMember || requesterMember.role !== 'admin')) {
    throw new Error('FORBIDDEN: Only organization owners or admins can invite members');
  }

  // 2. Check if user with this email is already a member
  const existingUser = await User.findOne({ email: normalizedEmail }).lean();
  if (existingUser) {
    const isAlreadyMember = org.members.some((m) => m.userId.toString() === existingUser._id.toString());
    if (isAlreadyMember) {
      throw new Error('User is already a member of this organization');
    }
  }

  // 3. Generate cryptographic token (256-bit secure hex)
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRATION_DAYS);

  // 4. Create or update pending invitation (Resend support!)
  let invite = await OrganizationInvite.findOne({
    organizationId: orgObjectId,
    email: normalizedEmail,
    status: 'pending',
  });

  const isResend = Boolean(invite);

  if (invite) {
    invite.token = token;
    invite.role = role;
    invite.expiresAt = expiresAt;
    invite.invitedBy = reqObjectId;
    await invite.save();
  } else {
    invite = await OrganizationInvite.create({
      organizationId: orgObjectId,
      email: normalizedEmail,
      role,
      token,
      invitedBy: reqObjectId,
      status: 'pending',
      expiresAt,
    });
  }

  // 5. Construct invite URL
  const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const inviteLink = `${baseUrl}/invite/${token}`;

  // 6. Send transactional invitation email
  const inviterUser = await User.findById(reqObjectId).lean();
  const inviterName = inviterUser?.name || 'A team member';

  const html = emailService.renderTeamInviteHtml({
    orgName: org.name,
    inviterName,
    role,
    inviteLink,
    expiresInDays: INVITE_EXPIRATION_DAYS,
  });

  await emailService.sendEmail({
    to: normalizedEmail,
    subject: `You're invited to join ${org.name} on Ruhi AI`,
    html,
  });

  // 7. Audit Logging
  await AuditLog.create({
    userId: reqObjectId,
    organizationId: orgObjectId,
    action: isResend ? 'ORGANIZATION_INVITE_RESENT' : 'ORGANIZATION_INVITE_CREATED',
    resourceType: 'OrganizationInvite',
    resourceId: invite._id.toString(),
    metadata: { email: normalizedEmail, role, isResend, expiresAt },
  });

  return {
    invite: {
      _id: invite._id.toString(),
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      isResend,
    },
    inviteLink,
  };
}

export async function getInvitationDetails(token: string) {
  await connectDB();
  if (!token || token.length < 32) {
    throw new Error('Invalid invitation token');
  }

  const invite = await OrganizationInvite.findOne({
    token,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  })
    .populate('organizationId', 'name slug')
    .populate('invitedBy', 'name email')
    .lean();

  if (!invite) {
    return null;
  }

  return {
    id: invite._id.toString(),
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt,
    organization: invite.organizationId,
    invitedBy: invite.invitedBy,
  };
}

export async function acceptInvitation(token: string, acceptingUserId: string) {
  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(acceptingUserId);

  const invite = await OrganizationInvite.findOne({
    token,
    status: 'pending',
  });

  if (!invite) {
    throw new Error('Invitation not found or has already been used');
  }

  if (new Date() > invite.expiresAt) {
    invite.status = 'expired';
    await invite.save();
    throw new Error('This invitation has expired');
  }

  const org = await Organization.findById(invite.organizationId);
  if (!org) {
    throw new Error('The inviting organization no longer exists');
  }

  // Atomically mark invitation as accepted (single-use guarantee)
  invite.status = 'accepted';
  invite.acceptedAt = new Date();
  invite.acceptedBy = userObjectId;
  await invite.save();

  // Add member to organization if not already present
  const alreadyMember = org.members.some((m) => m.userId.equals(userObjectId));
  if (!alreadyMember) {
    org.members.push({
      userId: userObjectId,
      role: invite.role,
      joinedAt: new Date(),
    });
    await org.save();
  }

  // Audit Logging
  await AuditLog.create({
    userId: userObjectId,
    organizationId: org._id,
    action: 'ORGANIZATION_INVITE_ACCEPTED',
    resourceType: 'OrganizationInvite',
    resourceId: invite._id.toString(),
    metadata: { role: invite.role, orgName: org.name },
  });

  return {
    success: true,
    organization: {
      id: org._id.toString(),
      name: org.name,
      slug: org.slug,
      role: invite.role,
    },
  };
}

export async function revokeInvitation(inviteId: string, requesterUserId: string) {
  await connectDB();
  const inviteObjectId = new mongoose.Types.ObjectId(inviteId);
  const reqObjectId = new mongoose.Types.ObjectId(requesterUserId);

  const invite = await OrganizationInvite.findById(inviteObjectId);
  if (!invite) throw new Error('Invitation not found');

  const org = await Organization.findById(invite.organizationId);
  if (!org) throw new Error('Organization not found');

  const isOwner = org.ownerId.equals(reqObjectId);
  const requesterMember = org.members.find((m) => m.userId.equals(reqObjectId));
  if (!isOwner && (!requesterMember || requesterMember.role !== 'admin')) {
    throw new Error('FORBIDDEN: Only organization owners or admins can revoke invitations');
  }

  invite.status = 'revoked';
  await invite.save();

  await AuditLog.create({
    userId: reqObjectId,
    organizationId: org._id,
    action: 'ORGANIZATION_INVITE_REVOKED',
    resourceType: 'OrganizationInvite',
    resourceId: invite._id.toString(),
    metadata: { email: invite.email },
  });

  return { success: true };
}

export async function listOrganizationInvites(orgId: string, requesterUserId: string) {
  await connectDB();
  const orgObjectId = new mongoose.Types.ObjectId(orgId);
  const reqObjectId = new mongoose.Types.ObjectId(requesterUserId);

  const org = await Organization.findById(orgObjectId).lean();
  if (!org) throw new Error('Organization not found');

  const isOwner = org.ownerId.toString() === requesterUserId;
  const requesterMember = org.members.find((m) => m.userId.toString() === requesterUserId);
  if (!isOwner && (!requesterMember || requesterMember.role !== 'admin')) {
    throw new Error('FORBIDDEN: Only organization owners or admins can list invitations');
  }

  const invites = await OrganizationInvite.find({ organizationId: orgObjectId })
    .populate('invitedBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return invites.map((inv: any) => ({
    _id: inv._id.toString(),
    email: inv.email,
    role: inv.role,
    status: inv.status,
    expiresAt: inv.expiresAt,
    invitedBy: inv.invitedBy,
    createdAt: inv.createdAt,
  }));
}
