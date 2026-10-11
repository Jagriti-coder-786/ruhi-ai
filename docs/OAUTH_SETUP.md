# 🔐 Ruhi AI — OAuth Connector Setup Guide

Ruhi AI provides secure OAuth 2.0 connectors for **Google Drive**, **GitHub**, and **Slack**.
All integrations use **HMAC-SHA256 cryptographically signed state tokens** to eliminate OAuth CSRF attacks and session fixation.

---

## 1. Environment Variables Configuration

Add the following environment variables to your `.env.local` or production deployment environment:

```env
# Base Application URL (Used to construct validated callback URLs)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# 1. Google Drive Connector
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 2. GitHub Connector
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# 3. Slack Connector
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
```

---

## 2. Google Drive Setup (Google Cloud Console)

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services > Credentials**.
3. Click **Create Credentials > OAuth client ID**.
4. Application Type: **Web application**.
5. Name: `Ruhi AI Connector`.
6. **Authorized JavaScript origins**:
   - `http://localhost:3000` (for local development)
   - `https://your-domain.com` (for production)
7. **Authorized redirect URIs**:
   - `http://localhost:3000/api/connectors/oauth/google_drive/callback`
   - `https://your-domain.com/api/connectors/oauth/google_drive/callback`
8. In **APIs & Services > Library**, enable:
   - **Google Drive API**
9. In **OAuth consent screen**, add the scopes:
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

---

## 3. GitHub Setup (GitHub Developer Settings)

1. Go to [GitHub Developer Settings > OAuth Apps](https://github.com/settings/developers).
2. Click **New OAuth App**.
3. Application name: `Ruhi AI GitHub Connector`.
4. Homepage URL: `https://your-domain.com` (or `http://localhost:3000`).
5. **Authorization callback URL**:
   - `http://localhost:3000/api/connectors/oauth/github/callback` (for local development)
   - `https://your-domain.com/api/connectors/oauth/github/callback` (for production)
6. Generate a client secret and save both `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

---

## 4. Slack Setup (Slack API Portal)

1. Go to [Slack API Console](https://api.slack.com/apps) and click **Create New App > From scratch**.
2. App Name: `Ruhi AI Slack Connector`.
3. Under **OAuth & Permissions > Redirect URLs**, add:
   - `http://localhost:3000/api/connectors/oauth/slack/callback` (for local development)
   - `https://your-domain.com/api/connectors/oauth/slack/callback` (for production)
4. Under **User Token Scopes**, add:
   - `channels:read`
   - `chat:write`
   - `users:read`
   - `team:read`
5. Navigate to **Basic Information**, copy **Client ID** and **Client Secret** into your `.env.local`.

---

## 5. Security & Verification

- **CSRF Defense**: All authorization requests issue an ephemeral 15-minute token generated via `createOAuthState()` using HMAC-SHA256 keyed to your `JWT_SECRET`.
- **Redirect Validation**: Callbacks reject any unverified foreign origin domains.
- **Audit Logging**: Every successful connection is permanently logged in the `AuditLog` collection.
