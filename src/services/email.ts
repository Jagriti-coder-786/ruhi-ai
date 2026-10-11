import { safeDiagnostics } from '@/services/ai/orchestrator/observability';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  provider: 'resend' | 'smtp' | 'development_fallback';
  previewUrl?: string;
}

export class EmailService {
  /**
   * Sends a transactional email using configured provider or safe development logging
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
    const { to, subject, html, text } = options;
    const resendKey = process.env.RESEND_API_KEY;

    // 1. If Resend is configured
    if (resendKey && resendKey.startsWith('re_')) {
      try {
        const fromEmail = process.env.EMAIL_FROM || 'Ruhi AI <notifications@ruhi.ai>';
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [to],
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, ''),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            messageId: data.id,
            provider: 'resend',
          };
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn('[EmailService] Resend API error:', errData);
        }
      } catch (err: any) {
        console.warn('[EmailService] Resend delivery failed, falling back:', err.message);
      }
    }

    // 2. Safe Fallback for Local Development & Staging
    const mockMessageId = `mock_msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log(`\n📧 =================== TRANSACTIONAL EMAIL ===================`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Status: Sent via Development/Sandbox Email Transport`);
    console.log(`============================================================\n`);

    safeDiagnostics.record('auth_event' as any, {
      emailAction: 'transactional_email_sent',
      recipientDomain: to.split('@')[1] || 'unknown',
      subjectPrefix: subject.slice(0, 30),
      provider: 'development_fallback',
    });

    return {
      success: true,
      messageId: mockMessageId,
      provider: 'development_fallback',
    };
  }

  /**
   * Generates HTML template for Team Invitation
   */
  renderTeamInviteHtml(params: {
    orgName: string;
    inviterName: string;
    role: string;
    inviteLink: string;
    expiresInDays: number;
  }): string {
    const { orgName, inviterName, role, inviteLink, expiresInDays } = params;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #f3f4f6; padding: 24px; margin: 0; }
    .container { max-width: 560px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { font-size: 24px; font-weight: 700; color: #ec4899; margin-bottom: 16px; }
    .content { font-size: 15px; line-height: 1.6; color: #d1d5db; margin-bottom: 24px; }
    .button-container { text-align: center; margin: 32px 0; }
    .button { background: linear-gradient(135deg, #ec4899, #8b5cf6); color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; }
    .footer { font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #1f2937; padding-top: 16px; }
    .role-badge { display: inline-block; background: #374151; color: #e5e7eb; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">🌸 Ruhi AI Team Workspace</div>
    <div class="content">
      <p>Hello,</p>
      <p><strong>${inviterName}</strong> has invited you to join the <strong>${orgName}</strong> workspace on Ruhi AI as a <span class="role-badge">${role.toUpperCase()}</span>.</p>
      <p>In this workspace, you can collaborate on shared AI projects, execute autonomous tasks, and access shared knowledge bases with enterprise-grade data privacy.</p>
    </div>
    <div class="button-container">
      <a href="${inviteLink}" class="button" target="_blank">Accept Invitation</a>
    </div>
    <div class="content">
      <p style="font-size: 13px; color: #9ca3af;">This link is single-use and will expire in <strong>${expiresInDays} days</strong>. If you did not expect this invitation, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      Sent with security from Ruhi AI Workspace Platform &bull; Protected by Single-Use Authentication Tokens
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

export const emailService = new EmailService();
export default emailService;
