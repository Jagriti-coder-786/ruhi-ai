import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { requireAuth } from '@/lib/auth/session';
import { aiRouter } from '@/providers/ai/router';
import { getActiveMemoriesPrompt } from '@/services/memory';
import { getProjectContextPrompt } from '@/services/projects';
import { retrieveRelevantChunks } from '@/services/rag/retriever';
import { formatDocumentContextForPrompt } from '@/services/rag/sanitizer';
import { webSearchTool, calculatorTool } from '@/services/tools';
import { checkQuota, recordUsage } from '@/services/usage';
import { ICitation, IToolCall } from '@/types';
import { ProviderChatMessage } from '@/providers/ai/interface';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    await connectDB();

    // 1. Quota Check
    const quota = await checkQuota(user.userId, user.plan);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 429 });
    }

    const body = await req.json();
    const {
      conversationId: incomingConvoId,
      content,
      modelId = 'ruhi-balanced',
      attachments = [],
      webSearchEnabled = false,
      projectId,
    } = body;

    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Message content or attachment is required' }, { status: 400 });
    }

    // 2. Resolve Conversation
    let conversationId = incomingConvoId;
    let conversation: any = null;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: new mongoose.Types.ObjectId(conversationId),
        userId: new mongoose.Types.ObjectId(user.userId),
      });
    }

    if (!conversation) {
      const generatedTitle = (content || 'New Conversation').slice(0, 42);
      conversation = await Conversation.create({
        userId: new mongoose.Types.ObjectId(user.userId),
        title: generatedTitle,
        model: modelId,
        projectId: projectId ? new mongoose.Types.ObjectId(projectId) : undefined,
      });
      conversationId = conversation._id.toString();
    }

    // 3. Save User Message to MongoDB
    const userMessage = await Message.create({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      userId: new mongoose.Types.ObjectId(user.userId),
      role: 'user',
      content: content || '[Attached media/files]',
      model: modelId,
      attachments: attachments.map((att: any) => ({
        name: att.name,
        type: att.type,
        mimeType: att.mimeType,
        size: att.size,
        dataBase64: att.dataBase64,
        documentId: att.documentId ? new mongoose.Types.ObjectId(att.documentId) : undefined,
      })),
    });

    // 4. Retrieve Context: Memory + Project
    const [memoriesPrompt, projectPrompt] = await Promise.all([
      getActiveMemoriesPrompt(user.userId),
      getProjectContextPrompt(projectId || conversation.projectId?.toString(), user.userId),
    ]);

    // 5. RAG Retrieval if documents are attached or present
    const docIds = attachments
      .filter((a: any) => a.documentId)
      .map((a: any) => a.documentId);

    const citations: ICitation[] = [];
    let ragContext = '';

    if (docIds.length > 0 || projectId) {
      try {
        const ragResult = await retrieveRelevantChunks({
          userId: user.userId,
          query: content || '',
          documentIds: docIds.length > 0 ? docIds : undefined,
          projectId: projectId || conversation.projectId?.toString(),
          topK: 4,
        });

        if (ragResult.chunks.length > 0) {
          ragContext = formatDocumentContextForPrompt(ragResult.chunks);
          citations.push(...ragResult.citations);
        }
      } catch (e) {
        console.warn('RAG retrieval failed gracefully:', e);
      }
    }

    // 6. Tools Execution: Web Search / Math
    const toolCallsExecuted: IToolCall[] = [];
    let toolResultContext = '';

    if (webSearchEnabled || /search the web|latest news|current price|weather|today's news/i.test(content)) {
      try {
        const searchRes = await webSearchTool.execute({ query: content }, user.userId);
        toolCallsExecuted.push({
          toolName: 'web_search',
          args: { query: content },
          result: searchRes.result as Record<string, unknown>,
          status: 'success',
        });
        if (searchRes.citations) {
          citations.push(...searchRes.citations);
        }
        toolResultContext += `\n[WEB SEARCH RESULTS]:\n${searchRes.summaryText}\n`;
      } catch (err: any) {
        console.warn('Web search error:', err.message);
      }
    }

    if (/^calculate[:\s]+|^what is \d+[\d\s+\-*/%^()]+/i.test(content)) {
      try {
        const mathExpr = content.replace(/^calculate[:\s]+/i, '').trim();
        const calcRes = await calculatorTool.execute({ expression: mathExpr }, user.userId);
        toolCallsExecuted.push({
          toolName: 'calculator',
          args: { expression: mathExpr },
          result: calcRes.result as Record<string, unknown>,
          status: 'success',
        });
        toolResultContext += `\n[CALCULATOR COMPUTATION]:\n${calcRes.summaryText}\n`;
      } catch (err: any) {
        console.warn('Calculator tool error:', err.message);
      }
    }

    // 7. Compose System Instruction
    const systemPromptParts = [
      `You are Ruhi, a brilliant, thoughtful, empathetic, and highly capable personal AI assistant.`,
      `Core Personality Guidelines:`,
      `- Helpful, warm, intellectually rigorous, and authentic.`,
      `- Concise when answering direct questions; deeply structured and detailed when explaining concepts, coding, or writing.`,
      `- Always distinguish verified facts from assumptions. If you don't know something, acknowledge it honestly.`,
      `- Format technical answers with elegant Markdown, syntax-highlighted code blocks, and structured lists where helpful.`,
      memoriesPrompt,
      projectPrompt,
      ragContext,
      toolResultContext ? `[ACTIVE TOOL OBSERVATIONS]\n${toolResultContext}` : '',
    ].filter(Boolean);

    const systemInstruction = systemPromptParts.join('\n\n');

    // 8. Prepare Chat History for Provider
    const recentMessages = await Message.find({
      conversationId: new mongoose.Types.ObjectId(conversationId),
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const formattedHistory: ProviderChatMessage[] = recentMessages
      .reverse()
      .map((m: any) => ({
        role: m.role as 'user' | 'assistant' | 'system' | 'tool',
        content: m.content,
      }));

    const hasImages = attachments.some((a: any) => a.type === 'image' || a.mimeType?.startsWith('image/'));

    // Image data if applicable
    const imagePayload = attachments
      .filter((a: any) => a.dataBase64)
      .map((a: any) => ({
        base64: a.dataBase64,
        mimeType: a.mimeType || 'image/png',
      }));

    if (imagePayload.length > 0 && formattedHistory.length > 0) {
      formattedHistory[formattedHistory.length - 1].images = imagePayload;
    }

    // 9. Streaming SSE Setup
    const textEncoder = new TextEncoder();
    let accumulatedText = '';

    const stream = new ReadableStream({
      async start(controller) {
        const initialPayload = JSON.stringify({
          type: 'start',
          conversationId,
          userMessageId: userMessage._id.toString(),
          citations,
          toolCalls: toolCallsExecuted,
        });
        controller.enqueue(textEncoder.encode(`data: ${initialPayload}\n\n`));

        try {
          const generator = aiRouter.streamRoutedText(
            {
              modelId,
              messages: formattedHistory,
              systemInstruction,
              temperature: 0.7,
            },
            user.plan,
            hasImages
          );

          for await (const chunk of generator) {
            if (chunk.text) {
              accumulatedText += chunk.text;
              const chunkPayload = JSON.stringify({
                type: 'chunk',
                text: chunk.text,
              });
              controller.enqueue(textEncoder.encode(`data: ${chunkPayload}\n\n`));
            }
          }

          // Save assistant message to MongoDB
          const promptTokens = Math.round(
            (systemInstruction.length + (content || '').length) / 4
          );
          const completionTokens = Math.round(accumulatedText.length / 4);
          const totalTokens = promptTokens + completionTokens;

          const assistantMsg = await Message.create({
            conversationId: new mongoose.Types.ObjectId(conversationId),
            userId: new mongoose.Types.ObjectId(user.userId),
            role: 'assistant',
            content: accumulatedText || 'No response generated.',
            model: modelId,
            citations: citations.length > 0 ? citations : undefined,
            toolCalls: toolCallsExecuted.length > 0 ? toolCallsExecuted : undefined,
            tokenUsage: {
              promptTokens,
              completionTokens,
              totalTokens,
            },
          });

          // Update conversation metadata
          await Conversation.findByIdAndUpdate(conversationId, {
            $set: {
              'metadata.lastMessagePreview': (accumulatedText || '').slice(0, 100),
              updatedAt: new Date(),
            },
            $inc: { 'metadata.totalMessages': 2 },
          });

          // Record usage for rate limiting and billing
          await recordUsage({
            userId: user.userId,
            tokensTotal: totalTokens,
            promptTokens,
            completionTokens,
            toolCall: toolCallsExecuted.length > 0,
          });

          const donePayload = JSON.stringify({
            type: 'done',
            messageId: assistantMsg._id.toString(),
            totalTokens,
          });
          controller.enqueue(textEncoder.encode(`data: ${donePayload}\n\n`));
        } catch (streamErr: any) {
          console.error('Stream processing error:', streamErr);
          const errorPayload = JSON.stringify({
            type: 'error',
            error: streamErr.message || 'Stream generation failed',
          });
          controller.enqueue(textEncoder.encode(`data: ${errorPayload}\n\n`));
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
    console.error('Chat endpoint error:', err);
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message || 'Chat error' }, { status: 500 });
  }
}
