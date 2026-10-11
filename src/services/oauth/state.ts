import crypto from 'crypto';
import { env } from '@/config/env';

export interface OAuthStatePayload {
  userId: string;
  provider: string;
  timestamp: number;
  nonce: string;
}

const STATE_TTL_MS = 15 * 60 * 1000; // 15 minutes validity

/**
 * Creates a cryptographically signed HMAC-SHA256 OAuth state token to protect against CSRF attacks.
 */
export function createOAuthState(userId: string, provider: string): string {
  const secret = env.JWT_SECRET || 'ruhi_oauth_secure_fallback_secret';
  const payload: OAuthStatePayload = {
    userId,
    provider,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
  };

  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadEncoded)
    .digest('base64url');

  return `${payloadEncoded}.${signature}`;
}

/**
 * Verifies the HMAC-SHA256 OAuth state token and ensures it has not expired or been tampered with.
 */
export function verifyOAuthState(stateToken: string): OAuthStatePayload | null {
  if (!stateToken || !stateToken.includes('.')) {
    return null;
  }

  const [payloadEncoded, signature] = stateToken.split('.');
  const secret = env.JWT_SECRET || 'ruhi_oauth_secure_fallback_secret';

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadEncoded)
      .digest('base64url');

    const expBuf = Buffer.from(expectedSignature, 'utf8');
    const actBuf = Buffer.from(signature, 'utf8');
    if (expBuf.length !== actBuf.length || !crypto.timingSafeEqual(expBuf, actBuf)) {
      return null;
    }

    const payloadJson = Buffer.from(payloadEncoded, 'base64url').toString('utf8');
    const payload: OAuthStatePayload = JSON.parse(payloadJson);

    // Verify TTL (15 minutes)
    if (Date.now() - payload.timestamp > STATE_TTL_MS) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
