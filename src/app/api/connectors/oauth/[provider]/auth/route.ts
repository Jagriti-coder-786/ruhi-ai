import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';

export async function GET(req: Request, context: { params: Promise<{ provider: string }> }) {
  try {
    const user = await requireAuth(req);
    const { provider } = await context.params;

    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const callbackUrl = `${protocol}://${host}/api/connectors/oauth/${provider}/callback`;

    let authUrl = '';

    if (provider === 'google_drive' || provider === 'gmail' || provider === 'google_calendar') {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) throw new Error('Missing GOOGLE_CLIENT_ID');

      // Scopes based on provider
      let scope = '';
      if (provider === 'google_drive') scope = 'https://www.googleapis.com/auth/drive.readonly';
      if (provider === 'gmail') scope = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose';
      if (provider === 'google_calendar') scope = 'https://www.googleapis.com/auth/calendar';

      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${user.userId}`;
    } else if (provider === 'github') {
      const clientId = process.env.GITHUB_CLIENT_ID;
      if (!clientId) throw new Error('Missing GITHUB_CLIENT_ID');
      
      authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=repo,user&state=${user.userId}`;
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    return NextResponse.redirect(authUrl);

  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
