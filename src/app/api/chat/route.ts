import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { aiOrchestrator } from '@/services/ai/orchestrator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();

    const {
      conversationId,
      content,
      modelId = 'ruhi-balanced',
      attachments = [],
      webSearchEnabled = false,
      projectId,
      isTemporary = false,
      regenerateMessageId,
      responseStyle,
      responseLength,
    } = body;

    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Message content or attachment is required' }, { status: 400 });
    }

    const textEncoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          controller.enqueue(textEncoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          const orchestration = await aiOrchestrator.process({
            userId: user.userId,
            userPlan: user.plan,
            conversationId,
            content,
            modelId,
            attachments,
            webSearchEnabled,
            projectId,
            isTemporary,
            regenerateMessageId,
            responseStyle,
            responseLength,
            onStatusUpdate: (status) => {
              sendEvent({
                type: 'status',
                status: status.message,
                icon: status.icon,
              });
            },
          });

          // Send initial metadata
          sendEvent({
            type: 'start',
            conversationId: orchestration.conversationId,
            userMessageId: orchestration.userMessageId,
            citations: orchestration.citations,
            toolCalls: orchestration.toolCalls,
            detectedLanguage: orchestration.languageAnalysis.detectedLanguage,
            isHinglish: orchestration.languageAnalysis.isHinglish,
          });

          let accumulatedText = '';

          // Stream chunks
          for await (const chunk of orchestration.stream) {
            if (chunk.text) {
              accumulatedText += chunk.text;
              sendEvent({
                type: 'chunk',
                text: chunk.text,
              });
            }
          }

          // Finalize message storage, quota, and validation
          const finalized = await orchestration.finalizeMessage(accumulatedText);

          sendEvent({
            type: 'done',
            messageId: finalized.messageId,
            totalTokens: finalized.totalTokens,
          });
        } catch (streamErr: any) {
          console.error('Chat orchestration error:', streamErr);
          sendEvent({
            type: 'error',
            error: streamErr.message || 'Stream processing failed',
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error('Chat API error:', err);
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (err.message?.startsWith('QUOTA_EXCEEDED')) {
      return NextResponse.json({ error: err.message.replace('QUOTA_EXCEEDED: ', '') }, { status: 429 });
    }
    return NextResponse.json({ error: err.message || 'Chat error' }, { status: 500 });
  }
}
