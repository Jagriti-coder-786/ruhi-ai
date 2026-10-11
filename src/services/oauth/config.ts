export interface OAuthProviderConfig {
  name: string;
  authUrl: string;
  tokenUrl: string;
  defaultScopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
}

export const OAUTH_CONFIGS: Record<string, OAuthProviderConfig> = {
  google_drive: {
    name: 'Google Drive',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    defaultScopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
  },
  github: {
    name: 'GitHub',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    defaultScopes: ['repo', 'read:user', 'user:email'],
    clientIdEnv: 'GITHUB_CLIENT_ID',
    clientSecretEnv: 'GITHUB_CLIENT_SECRET',
  },
  slack: {
    name: 'Slack',
    authUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    defaultScopes: ['channels:read', 'chat:write', 'users:read', 'team:read'],
    clientIdEnv: 'SLACK_CLIENT_ID',
    clientSecretEnv: 'SLACK_CLIENT_SECRET',
  },
};

/**
 * Builds a validated, trusted callback URL matching the host or NEXT_PUBLIC_APP_URL
 */
export function getValidatedCallbackUrl(req: Request, provider: string): string {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (configuredAppUrl && configuredAppUrl.startsWith('http')) {
    return `${configuredAppUrl.replace(/\/$/, '')}/api/connectors/oauth/${provider}/callback`;
  }

  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host') || 'localhost:3000';
  return `${proto}://${host}/api/connectors/oauth/${provider}/callback`;
}
