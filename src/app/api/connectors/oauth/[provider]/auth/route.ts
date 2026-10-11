import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { OAUTH_CONFIGS, getValidatedCallbackUrl } from '@/services/oauth/config';
import { createOAuthState } from '@/services/oauth/state';

export async function GET(
  req: Request,
  context: { params: Promise<{ provider: string }> }
) {
  try {
    const user = await requireAuth(req);
    const { provider } = await context.params;

    const config = OAUTH_CONFIGS[provider];
    if (!config) {
      return NextResponse.json(
        { error: `Unsupported OAuth connector: "${provider}". Supported: google_drive, github, slack.` },
        { status: 400 }
      );
    }

    const clientId = process.env[config.clientIdEnv];
    if (!clientId) {
      return NextResponse.json(
        {
          error: `Missing OAuth credentials for ${config.name}. Please set ${config.clientIdEnv} in your environment variables.`,
          requiredEnv: config.clientIdEnv,
        },
        { status: 400 }
      );
    }

    const callbackUrl = getValidatedCallbackUrl(req, provider);
    const stateToken = createOAuthState(user.userId, provider);

    let authRedirectUrl = '';

    if (provider === 'google_drive') {
      const scopeParam = encodeURIComponent(config.defaultScopes.join(' '));
      authRedirectUrl = `${config.authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=${scopeParam}&access_type=offline&prompt=consent&state=${stateToken}`;
    } else if (provider === 'github') {
      const scopeParam = encodeURIComponent(config.defaultScopes.join(','));
      authRedirectUrl = `${config.authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${scopeParam}&state=${stateToken}`;
    } else if (provider === 'slack') {
      const scopeParam = encodeURIComponent(config.defaultScopes.join(','));
      authRedirectUrl = `${config.authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=&user_scope=${scopeParam}&state=${stateToken}`;
    }

    return NextResponse.redirect(authRedirectUrl);
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
