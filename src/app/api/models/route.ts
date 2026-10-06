import { NextResponse } from 'next/server';
import modelRegistry from '@/providers/ai/registry';
import { getAuthUser } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    const tier = user?.plan || 'free';
    const models = modelRegistry.getAllModels();

    return NextResponse.json({
      models,
      userTier: tier,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
