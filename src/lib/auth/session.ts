import { verifyAuthToken, TokenPayload } from './jwt';

export async function getAuthUser(req: Request): Promise<TokenPayload | null> {
  // 1. Check Authorization header: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const payload = verifyAuthToken(token);
    if (payload) return payload;
  }

  // 2. Check Cookie: ruhi_session
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim().split('='))
      .filter(([k]) => Boolean(k))
  );

  const sessionToken = cookies['ruhi_session'];
  if (sessionToken) {
    const payload = verifyAuthToken(sessionToken);
    if (payload) return payload;
  }

  return null;
}

export async function requireAuth(req: Request): Promise<TokenPayload> {
  const user = await getAuthUser(req);
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requireAdmin(req: Request): Promise<TokenPayload> {
  const user = await requireAuth(req);
  if (user.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  return user;
}
