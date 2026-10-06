import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import imageGenerationService from '@/services/image';
import { recordUsage } from '@/services/usage';

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { prompt, width = 1024, height = 1024, model = 'flux' } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Image prompt is required' }, { status: 400 });
    }

    const generated = await imageGenerationService.generateImage({
      prompt,
      width,
      height,
      model,
    });

    // Record image generation in usage
    await recordUsage({
      userId: user.userId,
      isImageGen: true,
    });

    return NextResponse.json({
      imageUrl: generated.imageUrl,
      revisedPrompt: generated.revisedPrompt,
      provider: generated.provider,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Image generation failed' }, { status: 500 });
  }
}
