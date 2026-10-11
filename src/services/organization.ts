import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Organization, { OrganizationRole } from '@/models/Organization';
import AuditLog from '@/models/AuditLog';

export async function getUserOrganizations(userId: string) {
  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  return await Organization.find({
    $or: [{ ownerId: userObjectId }, { 'members.userId': userObjectId }],
  })
    .sort({ updatedAt: -1 })
    .lean();
}

export async function getOrganizationById(orgId: string, userId: string) {
  await connectDB();
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const orgObjectId = new mongoose.Types.ObjectId(orgId);

  const org = await Organization.findOne({
    _id: orgObjectId,
    $or: [{ ownerId: userObjectId }, { 'members.userId': userObjectId }],
  }).lean();

  return org;
}

export async function createOrganization(params: {
  name: string;
  slug?: string;
  ownerId: string;
}) {
  await connectDB();
  const ownerObjectId = new mongoose.Types.ObjectId(params.ownerId);
  const baseSlug = (params.slug || params.name)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);
  const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

  const org = await Organization.create({
    name: params.name.trim(),
    slug: uniqueSlug,
    ownerId: ownerObjectId,
    members: [
      {
        userId: ownerObjectId,
        role: 'owner',
        joinedAt: new Date(),
      },
    ],
    plan: 'team',
    settings: {
      enforceMfa: false,
      defaultModel: 'ruhi-balanced',
      dataRetentionDays: 90,
      allowPublicSharing: true,
    },
  });

  await AuditLog.create({
    userId: ownerObjectId,
    action: 'ORGANIZATION_CREATED',
    resourceType: 'Organization',
    resourceId: org._id.toString(),
    metadata: { name: org.name, slug: org.slug },
  });

  return org;
}

export async function addMemberToOrganization(params: {
  orgId: string;
  requesterUserId: string;
  targetUserId: string;
  role: OrganizationRole;
}) {
  await connectDB();
  const orgObjectId = new mongoose.Types.ObjectId(params.orgId);
  const reqObjectId = new mongoose.Types.ObjectId(params.requesterUserId);
  const targetObjectId = new mongoose.Types.ObjectId(params.targetUserId);

  const org = await Organization.findById(orgObjectId);
  if (!org) throw new Error('Organization not found');

  // Verify requester is owner or admin
  const requesterMember = org.members.find((m) => m.userId.equals(reqObjectId));
  const isOwner = org.ownerId.equals(reqObjectId);
  if (!isOwner && (!requesterMember || requesterMember.role !== 'admin')) {
    throw new Error('FORBIDDEN: Only organization owners or admins can invite members');
  }

  // Check if member already exists
  const existingIdx = org.members.findIndex((m) => m.userId.equals(targetObjectId));
  if (existingIdx >= 0) {
    org.members[existingIdx].role = params.role;
  } else {
    org.members.push({
      userId: targetObjectId,
      role: params.role,
      joinedAt: new Date(),
    });
  }

  await org.save();

  await AuditLog.create({
    userId: reqObjectId,
    organizationId: orgObjectId,
    action: 'ORGANIZATION_MEMBER_ADDED',
    resourceType: 'Organization',
    resourceId: org._id.toString(),
    metadata: { targetUserId: params.targetUserId, role: params.role },
  });

  return org;
}

export async function removeMemberFromOrganization(params: {
  orgId: string;
  requesterUserId: string;
  targetUserId: string;
}) {
  await connectDB();
  const orgObjectId = new mongoose.Types.ObjectId(params.orgId);
  const reqObjectId = new mongoose.Types.ObjectId(params.requesterUserId);
  const targetObjectId = new mongoose.Types.ObjectId(params.targetUserId);

  const org = await Organization.findById(orgObjectId);
  if (!org) throw new Error('Organization not found');

  if (org.ownerId.equals(targetObjectId)) {
    throw new Error('FORBIDDEN: Cannot remove the organization owner');
  }

  const isOwner = org.ownerId.equals(reqObjectId);
  const reqMember = org.members.find((m) => m.userId.equals(reqObjectId));
  if (!isOwner && (!reqMember || reqMember.role !== 'admin')) {
    throw new Error('FORBIDDEN: Only organization owners or admins can remove members');
  }

  org.members = org.members.filter((m) => !m.userId.equals(targetObjectId));
  await org.save();

  await AuditLog.create({
    userId: reqObjectId,
    organizationId: orgObjectId,
    action: 'ORGANIZATION_MEMBER_REMOVED',
    resourceType: 'Organization',
    resourceId: org._id.toString(),
    metadata: { targetUserId: params.targetUserId },
  });

  return org;
}
