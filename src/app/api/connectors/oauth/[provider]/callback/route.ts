import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import ConnectorIntegration from '@/models/ConnectorIntegration';

export async function GET(req: Request, context: { params: Promise<{ provider: string }> }) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // We passed userId in state
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect(new URL(`/settings/connectors?error=${error}`, req.url));
    }
    if (!code || !state) {
      return NextResponse.redirect(new URL(`/settings/connectors?error=invalid_request`, req.url));
    }

    const { provider } = await context.params;
    const userId = state;
    
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const callbackUrl = `${protocol}://${host}/api/connectors/oauth/${provider}/callback`;

    let accessToken = '';
    let refreshToken = '';
    let scopes: string[] = [];

    // Exchange code for tokens
    if (provider.startsWith('google_')) {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: callbackUrl,
        }),
      });
      const data = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(data.error_description || 'Failed to get token');
      
      accessToken = data.access_token;
      refreshToken = data.refresh_token || ''; // Refresh token is only sent on first auth usually
      scopes = (data.scope || '').split(' ');
      
    } else if (provider === 'github') {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID!,
          client_secret: process.env.GITHUB_CLIENT_SECRET!,
          code,
          redirect_uri: callbackUrl,
        }),
      });
      const data = await tokenRes.json();
      if (!tokenRes.ok || data.error) throw new Error(data.error_description || 'Failed to get token');
      
      accessToken = data.access_token;
      scopes = (data.scope || '').split(',');
    }

    await connectDB();

    // Upsert integration
    await ConnectorIntegration.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId), provider } as any,
      {
        $set: {
          accessToken,
          ...(refreshToken ? { refreshToken } : {}), // only update if provided
          scopes,
          isActive: true,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.redirect(new URL(`/settings/connectors?success=true&provider=${provider}`, req.url));

  } catch (err: any) {
    console.error(`OAuth Callback Error:`, err);
    return NextResponse.redirect(new URL(`/settings/connectors?error=server_error`, req.url));
  }
}
