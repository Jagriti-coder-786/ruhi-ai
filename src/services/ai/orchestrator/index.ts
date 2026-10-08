import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Artifact from '@/models/Artifact';
import { aiRouter } from '@/providers/ai/router';
import { getProjectContextPrompt } from '@/services/projects';
import { retrieveRelevantChunks } from '@/services/rag/retriever';
import { formatDocumentContextForPrompt } from '@/services/rag/sanitizer';
import { checkQuota, recordUsage } from '@/services/usage';
import { ICitation, IToolCall, IAttachment, SubscriptionTier } from '@/types';

import { detectLanguage, LanguageAnalysis } from './language';
import { detectIntent, IntentAnalysis } from './intent';
import { checkFreshnessRequirement, FreshnessCheckResult } from './freshness';
import { toolCoordinator } from './tools';
import { memoryOrchestrator } from './memory';
import { contextManager } from './context';
import { responseValidator } from './response';
import { generateSmartTitle } from './title';
import { executeDeepResearch } from './deepResearch';
import { analyzeData } from '@/services/analysis';

export interface OrchestrationRequest {
  userId: string;
  userPlan: SubscriptionTier;
  conversationId?: string;
  content: string;
  modelId?: string;
  attachments?: IAttachment[];
  webSearchEnabled?: boolean;
  projectId?: string;
  isTemporary?: boolean;
  regenerateMessageId?: string;
  responseStyle?: 'balanced' | 'concise' | 'detailed' | 'professional' | 'creative';
  responseLength?: 'short' | 'standard' | 'detailed';
  onStatusUpdate?: (status: { message: string; icon: string }) => void;
}

export interface OrchestrationResult {
  conversationId: string;
  userMessageId: string;
  citations: ICitation[];
  toolCalls: IToolCall[];
  languageAnalysis: LanguageAnalysis;
  intentAnalysis: IntentAnalysis;
  stream: AsyncIterable<{ text?: string }>;
  finalizeMessage: (accumulatedText: string) => Promise<{
    messageId: string;
    totalTokens: number;
    sanitizedText: string;
  }>;
}

export class AIOrchestrator {
  async process(req: OrchestrationRequest): Promise<OrchestrationResult> {
    const {
      userId,
      userPlan,
      content,
      modelId = 'ruhi-balanced',
      attachments = [],
      webSearchEnabled = false,
      projectId,
      isTemporary = false,
      regenerateMessageId,
      responseStyle,
      responseLength,
      onStatusUpdate,
    } = req;

    await connectDB();

    // 1. Quota Check
    const quota = await checkQuota(userId, userPlan);
    if (!quota.allowed) {
      throw new Error(`QUOTA_EXCEEDED: ${quota.reason}`);
    }

    // 2. Resolve Conversation
    let conversationId = req.conversationId;
    let conversation: any = null;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: new mongoose.Types.ObjectId(conversationId),
        userId: new mongoose.Types.ObjectId(userId),
      });
    }

    if (!conversation) {
      const generatedTitle = generateSmartTitle(content);
      const expiresAt = isTemporary ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined;
      conversation = await Conversation.create({
        userId: new mongoose.Types.ObjectId(userId),
        title: generatedTitle,
        model: modelId,
        projectId: projectId ? new mongoose.Types.ObjectId(projectId) : undefined,
        isTemporary: Boolean(isTemporary),
        expiresAt,
      });
      conversationId = conversation._id.toString();
    }

    // 3. Save User Message
    const userMessage = await Message.create({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      userId: new mongoose.Types.ObjectId(userId),
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

    // 4. Retrieve Context & History Early for Intelligence Layer
    const [memoriesPrompt, projectPrompt, historyData] = await Promise.all([
      isTemporary ? '' : memoryOrchestrator.getRelevantMemoriesPrompt(userId, content),
      getProjectContextPrompt(projectId || conversation.projectId?.toString(), userId),
      contextManager.buildConversationHistory({
        conversationId: conversationId!,
        maxRecentMessages: 10,
      }),
    ]);

    // 5. Intelligence: Language Detection & Context-Aware Intent Engine
    const languageAnalysis = detectLanguage(content);
    const hasAttachments = attachments.length > 0;
    const intentAnalysis = detectIntent(content, {
      hasAttachments,
      conversationHistory: historyData.history,
      conversationSummary: historyData.summary,
      hasProject: Boolean(projectId || conversation.projectId),
    });
    const freshnessAnalysis: FreshnessCheckResult = checkFreshnessRequirement(content);

    const citations: ICitation[] = [];
    const toolCalls: IToolCall[] = [];
    let toolObservations = '';

    // =========================================================================
    // 6. IMMEDIATE INTELLIGENCE ROUTING SHORTCUTS
    // =========================================================================

    // A. Ambiguity Clarification (Test A: "can you give me prompt" with no context)
    if (intentAnalysis.detailedIntent === 'CLARIFY' && intentAnalysis.clarificationMessage) {
      const directText = intentAnalysis.clarificationMessage;
      async function* clarifyGenerator() {
        yield { text: directText };
      }

      return {
        conversationId: conversationId!,
        userMessageId: userMessage._id.toString(),
        citations: [],
        toolCalls: [],
        languageAnalysis,
        intentAnalysis,
        stream: clarifyGenerator(),
        finalizeMessage: async () => {
          const assistantMsg = await Message.create({
            conversationId: new mongoose.Types.ObjectId(conversationId),
            userId: new mongoose.Types.ObjectId(userId),
            role: 'assistant',
            content: directText,
            model: modelId,
            versions: [{ content: directText, model: modelId, createdAt: new Date() }],
            activeVersionIndex: 0,
            tokenUsage: { promptTokens: 10, completionTokens: 25, totalTokens: 35 },
          });
          return {
            messageId: assistantMsg._id.toString(),
            totalTokens: 35,
            sanitizedText: directText,
          };
        },
      };
    }

    // B. Missing Required Files Guard (Section 4 & 16: "Don't Just Give Advice" when user asks to modify project without files)
    if (intentAnalysis.missingRequiredFiles && intentAnalysis.fileRequestMessage) {
      const directText = intentAnalysis.fileRequestMessage;
      async function* fileReqGenerator() {
        yield { text: directText };
      }

      return {
        conversationId: conversationId!,
        userMessageId: userMessage._id.toString(),
        citations: [],
        toolCalls: [],
        languageAnalysis,
        intentAnalysis,
        stream: fileReqGenerator(),
        finalizeMessage: async () => {
          const assistantMsg = await Message.create({
            conversationId: new mongoose.Types.ObjectId(conversationId),
            userId: new mongoose.Types.ObjectId(userId),
            role: 'assistant',
            content: directText,
            model: modelId,
            versions: [{ content: directText, model: modelId, createdAt: new Date() }],
            activeVersionIndex: 0,
            tokenUsage: { promptTokens: 10, completionTokens: 25, totalTokens: 35 },
          });
          return {
            messageId: assistantMsg._id.toString(),
            totalTokens: 35,
            sanitizedText: directText,
          };
        },
      };
    }

    // C. Memory Command Execution (Immediate action if user says "Remember...", "Forget...", "What do you remember...")
    if (!isTemporary && intentAnalysis.primaryIntent === 'memory_command' && intentAnalysis.memoryAction) {
      const memResult = await memoryOrchestrator.handleMemoryCommand(
        intentAnalysis.memoryAction,
        userId
      );

      if (memResult.handledDirectly && memResult.confirmationMessage) {
        const directText = memResult.confirmationMessage;

        async function* directGenerator() {
          yield { text: directText };
        }

        return {
          conversationId: conversationId!,
          userMessageId: userMessage._id.toString(),
          citations: [],
          toolCalls: [],
          languageAnalysis,
          intentAnalysis,
          stream: directGenerator(),
          finalizeMessage: async () => {
            const assistantMsg = await Message.create({
              conversationId: new mongoose.Types.ObjectId(conversationId),
              userId: new mongoose.Types.ObjectId(userId),
              role: 'assistant',
              content: directText,
              model: modelId,
              versions: [{ content: directText, model: modelId, createdAt: new Date() }],
              activeVersionIndex: 0,
              tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            });
            return {
              messageId: assistantMsg._id.toString(),
              totalTokens: 30,
              sanitizedText: directText,
            };
          },
        };
      }
    }

    // D. Deep Research Execution (Systematic multi-query research with cited report)
    if (intentAnalysis.primaryIntent === 'deep_research') {
      onStatusUpdate?.({ message: '🔬 Planning and executing deep research...', icon: 'research' });
      const researchResult = await executeDeepResearch(content);
      citations.push(...researchResult.citations);
      const directText = researchResult.reportMarkdown;

      async function* researchGenerator() {
        yield { text: directText };
      }

      return {
        conversationId: conversationId!,
        userMessageId: userMessage._id.toString(),
        citations,
        toolCalls: [
          {
            toolName: 'deep_research',
            args: { objective: content },
            result: { sourcesCount: researchResult.sourcesAnalyzed, plan: researchResult.plan },
            status: 'success',
          },
        ],
        languageAnalysis,
        intentAnalysis,
        stream: researchGenerator(),
        finalizeMessage: async () => {
          const assistantMsg = await Message.create({
            conversationId: new mongoose.Types.ObjectId(conversationId),
            userId: new mongoose.Types.ObjectId(userId),
            role: 'assistant',
            content: directText,
            model: modelId,
            citations,
            versions: [{ content: directText, model: modelId, createdAt: new Date() }],
            activeVersionIndex: 0,
            tokenUsage: { promptTokens: 100, completionTokens: 400, totalTokens: 500 },
          });
          return {
            messageId: assistantMsg._id.toString(),
            totalTokens: 500,
            sanitizedText: directText,
          };
        },
      };
    }

    // E. Tabular Data Analysis Execution (CSV/Numbers analysis and profiling)
    if (
      intentAnalysis.primaryIntent === 'data_analysis' &&
      (content.includes(',') || content.includes('\n') || content.includes('{') || content.includes('['))
    ) {
      onStatusUpdate?.({ message: '📊 Analyzing tabular data and computing metrics...', icon: 'data' });
      const analysisResult = analyzeData(content);
      const chartSection = analysisResult.chartData
        ? `\n\n### 📈 Recommended Visualization: ${analysisResult.chartData.title}\n\`\`\`json\n${JSON.stringify(analysisResult.chartData, null, 2)}\n\`\`\``
        : '';

      const directText = `## 📊 Data Analysis Summary\n\n${analysisResult.insights.map((ins) => `- ${ins}`).join('\n')}\n\n### Attributes Profile\n| Column | Count | Unique | Mean | Min | Max |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n${analysisResult.columns
        .map((c) => {
          const s = analysisResult.summaryStats[c];
          return `| **${c}** | ${s.count} | ${s.unique ?? '-'} | ${s.mean ?? '-'} | ${s.min ?? '-'} | ${s.max ?? '-'} |`;
        })
        .join('\n')}${chartSection}\n\n*💡 Tip: Open the **Artifact Workspace** from the top bar to inspect or edit this in the spreadsheet grid or test transformations in the Code Sandbox.*`;

      async function* analysisGenerator() {
        yield { text: directText };
      }

      return {
        conversationId: conversationId!,
        userMessageId: userMessage._id.toString(),
        citations: [],
        toolCalls: [
          {
            toolName: 'data_analyzer',
            args: { rowCount: analysisResult.rowCount },
            result: { columns: analysisResult.columns },
            status: 'success',
          },
        ],
        languageAnalysis,
        intentAnalysis,
        stream: analysisGenerator(),
        finalizeMessage: async () => {
          const assistantMsg = await Message.create({
            conversationId: new mongoose.Types.ObjectId(conversationId),
            userId: new mongoose.Types.ObjectId(userId),
            role: 'assistant',
            content: directText,
            model: modelId,
            versions: [{ content: directText, model: modelId, createdAt: new Date() }],
            activeVersionIndex: 0,
            tokenUsage: { promptTokens: 50, completionTokens: 250, totalTokens: 300 },
          });
          return {
            messageId: assistantMsg._id.toString(),
            totalTokens: 300,
            sanitizedText: directText,
          };
        },
      };
    }

    // =========================================================================
    // 7. TOOL ROUTING
    // =========================================================================

    // Calculator Execution
    if (intentAnalysis.requiresCalculator && intentAnalysis.mathExpression) {
      onStatusUpdate?.({ message: '🧮 Calculating exact result...', icon: 'calc' });
      const calcResult = await toolCoordinator.executeCalculation(
        intentAnalysis.mathExpression,
        userId
      );
      toolCalls.push(...calcResult.toolCalls);
      toolObservations += `\n${calcResult.promptObservations}\n`;
    }

    // Freshness & Web Search
    const isBasicDateQuery = /^(what is|what's)?\s*(today|today'?s date|date|current time|time|what day is it|day|tomorrow|yesterday)\??$/i.test(content.trim());
    
    const shouldSearch =
      !isBasicDateQuery &&
      (webSearchEnabled ||
      freshnessAnalysis.requiresFreshData ||
      intentAnalysis.requiresLiveSearch);

    if (shouldSearch) {
      onStatusUpdate?.({ message: '🔎 Searching the web...', icon: 'search' });
      const searchQueries =
        freshnessAnalysis.generatedQueries.length > 0
          ? freshnessAnalysis.generatedQueries
          : [content];

      const searchResult = await toolCoordinator.executeSearch(searchQueries);
      toolCalls.push(...searchResult.toolCalls);
      citations.push(...searchResult.citations);
      toolObservations += `\n${searchResult.promptObservations}\n`;
    }

    // RAG Document Retrieval
    const docIds = attachments
      .filter((a: any) => a.documentId)
      .map((a: any) => a.documentId);

    let ragContext = '';
    if (docIds.length > 0 || projectId || intentAnalysis.requiresRag) {
      onStatusUpdate?.({ message: '📄 Reading your document...', icon: 'doc' });
      try {
        const ragResult = await retrieveRelevantChunks({
          userId,
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

    // =========================================================================
    // 8. DYNAMIC MODULAR SYSTEM INSTRUCTION (EXECUTION-FIRST)
    // =========================================================================
    const systemInstruction = contextManager.buildSystemPrompt({
      languageAnalysis,
      intentAnalysis,
      executionMode: intentAnalysis.executionMode,
      expectedDeliverable: intentAnalysis.expectedDeliverable,
      memoriesPrompt,
      projectPrompt,
      ragContext,
      toolObservations,
      conversationSummary: historyData.summary,
      responseStyle,
      responseLength,
    });

    // Multimodal Attachments Handling
    const hasImages = attachments.some(
      (a: any) => a.type === 'image' || a.mimeType?.startsWith('image/')
    );
    const imagePayload = attachments
      .filter((a: any) => a.dataBase64)
      .map((a: any) => ({
        base64: a.dataBase64,
        mimeType: a.mimeType || 'image/png',
      }));

    const formattedHistory = [...historyData.history];
    if (imagePayload.length > 0 && formattedHistory.length > 0) {
      formattedHistory[formattedHistory.length - 1].images = imagePayload;
    }

    // Status Update for Streaming
    if (intentAnalysis.executionMode === 'EXECUTION_MODE') {
      onStatusUpdate?.({ message: '⚡ Executing deliverable & building...', icon: 'code' });
    } else if (intentAnalysis.executionMode === 'PROMPT_GENERATION_MODE') {
      onStatusUpdate?.({ message: '🎯 Formulating tailored prompt...', icon: 'sparkles' });
    } else if (intentAnalysis.executionMode === 'ADVICE_MODE') {
      onStatusUpdate?.({ message: '💡 Formulating strategic plan...', icon: 'brain' });
    } else {
      onStatusUpdate?.({ message: '🧠 Preparing response...', icon: 'brain' });
    }

    // Provider Streaming via AI Router
    const generator = aiRouter.streamRoutedText(
      {
        modelId,
        messages: formattedHistory,
        systemInstruction,
        temperature: intentAnalysis.executionMode === 'EXECUTION_MODE' ? 0.3 : 0.7,
      },
      userPlan,
      hasImages
    );

    // =========================================================================
    // 9. FINALIZATION HELPER & ARTIFACT PERSISTENCE
    // =========================================================================
    const finalizeMessage = async (accumulatedText: string) => {
      const validated = responseValidator.validate(accumulatedText, citations, {
        executionMode: intentAnalysis.executionMode,
        expectedDeliverable: intentAnalysis.expectedDeliverable,
        missingRequiredFiles: intentAnalysis.missingRequiredFiles,
      });

      const promptTokens = Math.round(
        (systemInstruction.length + (content || '').length) / 4
      );
      const completionTokens = Math.round(validated.sanitizedText.length / 4);
      const totalTokens = promptTokens + completionTokens;

      // Handle regeneration versioning on existing message
      if (regenerateMessageId) {
        const existing = await Message.findOne({
          _id: new mongoose.Types.ObjectId(regenerateMessageId),
          userId: new mongoose.Types.ObjectId(userId),
        });

        if (existing) {
          const currentVersions =
            existing.versions && existing.versions.length > 0
              ? existing.versions
              : [
                  {
                    content: existing.content,
                    model: existing.model,
                    citations: existing.citations,
                    toolCalls: existing.toolCalls,
                    createdAt: existing.createdAt || new Date(),
                  },
                ];

          const newVersion = {
            content: validated.sanitizedText,
            model: modelId,
            citations: validated.validatedCitations.length > 0 ? validated.validatedCitations : undefined,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            createdAt: new Date(),
          };

          const updatedVersions = [...currentVersions, newVersion];
          existing.versions = updatedVersions as any;
          existing.activeVersionIndex = updatedVersions.length - 1;
          existing.content = validated.sanitizedText;
          existing.citations = validated.validatedCitations.length > 0 ? (validated.validatedCitations as any) : undefined;
          existing.toolCalls = toolCalls.length > 0 ? (toolCalls as any) : undefined;
          existing.set('model', modelId);
          await existing.save();

          return {
            messageId: existing._id.toString(),
            totalTokens,
            sanitizedText: validated.sanitizedText,
          };
        }
      }

      // Create new assistant message with version 1 initialized
      const assistantMsg = await Message.create({
        conversationId: new mongoose.Types.ObjectId(conversationId),
        userId: new mongoose.Types.ObjectId(userId),
        role: 'assistant',
        content: validated.sanitizedText,
        model: modelId,
        citations: validated.validatedCitations.length > 0 ? validated.validatedCitations : undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        versions: [
          {
            content: validated.sanitizedText,
            model: modelId,
            citations: validated.validatedCitations.length > 0 ? validated.validatedCitations : undefined,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            createdAt: new Date(),
          },
        ],
        activeVersionIndex: 0,
        tokenUsage: {
          promptTokens,
          completionTokens,
          totalTokens,
        },
      });

      // Update conversation metadata
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: {
          'metadata.lastMessagePreview': validated.sanitizedText.slice(0, 100),
          updatedAt: new Date(),
        },
        $inc: { 'metadata.totalMessages': 2 },
      });

      // Record quota usage
      await recordUsage({
        userId,
        tokensTotal: totalTokens,
        promptTokens,
        completionTokens,
        toolCall: toolCalls.length > 0,
      });

      // Automatic Artifact Persistence in Workspace for Execution Deliverables
      if (['CREATE_WEBSITE', 'CREATE_APPLICATION', 'CREATE_ARTIFACT'].includes(intentAnalysis.detailedIntent)) {
        const codeBlockMatch = validated.sanitizedText.match(/```(?:html|tsx|jsx|typescript|javascript|css)?\n([\s\S]*?)```/);
        if (codeBlockMatch && codeBlockMatch[1].trim().length > 50) {
          try {
            await Artifact.create({
              userId: new mongoose.Types.ObjectId(userId),
              conversationId: new mongoose.Types.ObjectId(conversationId),
              projectId: projectId ? new mongoose.Types.ObjectId(projectId) : undefined,
              title: conversation?.title || 'Generated Web Application',
              type: intentAnalysis.detailedIntent === 'CREATE_WEBSITE' ? 'interactive' : 'code',
              content: codeBlockMatch[1],
              language: 'typescript',
              metadata: {
                source: 'execution_engine',
                detailedIntent: intentAnalysis.detailedIntent,
                expectedDeliverable: intentAnalysis.expectedDeliverable,
              },
              versions: [
                {
                  content: codeBlockMatch[1],
                  title: conversation?.title || 'Generated Web Application',
                  createdAt: new Date(),
                },
              ],
            });
          } catch (artErr) {
            console.warn('Artifact auto-persistence handled gracefully:', artErr);
          }
        }
      }

      return {
        messageId: assistantMsg._id.toString(),
        totalTokens,
        sanitizedText: validated.sanitizedText,
      };
    };

    return {
      conversationId: conversationId!,
      userMessageId: userMessage._id.toString(),
      citations,
      toolCalls,
      languageAnalysis,
      intentAnalysis,
      stream: generator,
      finalizeMessage,
    };
  }
}

export const aiOrchestrator = new AIOrchestrator();
