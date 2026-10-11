import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import ConnectorIntegration from '@/models/ConnectorIntegration';
import Connector from '@/models/Connector';
import AuditLog from '@/models/AuditLog';
import { OAUTH_CONFIGS, getValidatedCallbackUrl } from '@/services/oauth/config';
import { verifyOAuthState } from '@/services/oauth/state';

export async function GET(
  req: Request,
  context: { params: Promise<{ provider: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const stateToken = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL(`/settings?tab=connectors&error=${encodeURIComponent(error)}`, req.url));
    }

    if (!code || !stateToken) {
      return NextResponse.redirect(new URL(`/settings?tab=connectors&error=missing_oauth_parameters`, req.url));
    }

    // 1. Verify CSRF signed state token
    const statePayload = verifyOAuthState(stateToken);
    if (!statePayload) {
      return NextResponse.redirect(new URL(`/settings?tab=connectors&error=invalid_or_expired_state`, req.url));
    }

    const { provider } = await context.params;
    if (statePayload.provider !== provider) {
      return NextResponse.redirect(new URL(`/settings?tab=connectors&error=provider_mismatch`, req.url));
    }

    const userId = statePayload.userId;
    const config = OAUTH_CONFIGS[provider];
    if (!config) {
      return NextResponse.redirect(new URL(`/settings?tab=connectors&error=unsupported_provider`, req.url));
    }

    const clientId = process.env[config.clientIdEnv];
    const clientSecret = process.env[config.clientSecretEnv];
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL(`/settings?tab=connectors&error=missing_server_credentials`, req.url));
    }

    const callbackUrl = getValidatedCallbackUrl(req, provider);

    let accessToken = '';
    let refreshToken = '';
    let scopes: string[] = [];
    let accountEmail = '';

    // 2. Token Exchange
    if (provider === 'google_drive') {
      const tokenRes = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: callbackUrl,
        }),
      });

      const data = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(data.error_description || 'Failed to exchange Google OAuth code');

      accessToken = data.access_token;
      refreshToken = data.refresh_token || '';
      scopes = (data.scope || '').split(' ');

      // Fetch user profile info
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          const userProfile = await userInfoRes.json();
          accountEmail = userProfile.email || '';
        }
      } catch {
        // Non-fatal
      }
    } else if (provider === 'github') {
      const tokenRes = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: callbackUrl,
        }),
      });

      const data = await tokenRes.json();
      if (!tokenRes.ok || data.error) throw new Error(data.error_description || data.error || 'Failed to exchange GitHub OAuth code');

      accessToken = data.access_token;
      scopes = (data.scope || '').split(',');

      // Fetch user info from GitHub API
      try {
        const ghUserRes = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'Ruhi-AI-Connector',
          },
        });
        if (ghUserRes.ok) {
          const ghUser = await ghUserRes.json();
          accountEmail = ghUser.email || ghUser.login || '';
        }
      } catch {
        // Non-fatal
      }
    } else if (provider === 'slack') {
      const tokenRes = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: callbackUrl,
        }),
      });

      const data = await tokenRes.json();
      if (!tokenRes.ok || !data.ok) throw new Error(data.error || 'Failed to exchange Slack OAuth code');

      accessToken = data.access_token || data.authed_user?.access_token || '';
      refreshToken = data.refresh_token || '';
      scopes = (data.scope || '').split(',');
      accountEmail = data.team?.name ? `${data.team.name} (Slack)` : 'Slack Workspace';
    }

    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 3. Upsert ConnectorIntegration record
    await ConnectorIntegration.findOneAndUpdate(
      { userId: userObjectId, provider } as any,
      {
        $set: {
          accessToken,
          ...(refreshToken ? { refreshToken } : {}),
          scopes,
          isActive: true,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // 4. Update Connector record for settings UI
    await Connector.findOneAndUpdate(
      { userId: userObjectId, provider } as any,
      {
        $set: {
          name: config.name,
          status: 'connected',
          accountEmail: accountEmail || `${provider}_connected`,
          scopes,
          lastSyncedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // 5. Audit Logging
    await AuditLog.create({
      userId: userObjectId,
      action: 'OAUTH_CONNECTOR_CONNECTED',
      resourceType: 'Connector',
      metadata: { provider, scopesCount: scopes.length },
    });

    return NextResponse.redirect(new URL(`/settings?tab=connectors&success=true&provider=${provider}`, req.url));
  } catch (err: any) {
    console.error('OAuth Callback Error:', err);
    return NextResponse.redirect(new URL(`/settings?tab=connectors&error=oauth_exchange_failed`, req.url));
  }
}
