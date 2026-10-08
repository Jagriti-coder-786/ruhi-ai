import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import { ProviderChatMessage } from '@/providers/ai/interface';
import { LanguageAnalysis } from './language';
import { IntentAnalysis, ExecutionMode, ExpectedDeliverable } from './intent';
import { getCurrentDateTime } from '@/lib/time/currentDateTime';

export interface DynamicPromptConfig {
  languageAnalysis: LanguageAnalysis;
  intentAnalysis?: IntentAnalysis;
  executionMode?: ExecutionMode;
  expectedDeliverable?: ExpectedDeliverable;
  memoriesPrompt?: string;
  projectPrompt?: string;
  ragContext?: string;
  toolObservations?: string;
  conversationSummary?: string;
  responseStyle?: 'balanced' | 'concise' | 'detailed' | 'professional' | 'creative';
  responseLength?: 'short' | 'standard' | 'detailed';
  learningMode?: 'general_chat' | 'tutor_socratic' | 'quiz_generation' | 'flashcard_generation' | 'visual_generation' | 'artifact_creation';
  isSocraticMode?: boolean;
}

export class ContextManager {
  /**
   * Build the modular system prompt according to context priority hierarchy
   */
  buildSystemPrompt(config: DynamicPromptConfig): string {
    const sections: string[] = [];
    
    const timeInfo = getCurrentDateTime();
    const mode = config.executionMode || config.intentAnalysis?.executionMode || 'ANSWER_MODE';
    const deliverable = config.expectedDeliverable || config.intentAnalysis?.expectedDeliverable || 'answer';

    // 1. Core Identity & Master Directives
    sections.push(`You are Ruhi, a World-Class Response Intelligence Engine and an exceptionally capable, warm, thoughtful, and deeply intelligent AI assistant.

CORE BEHAVIORAL DIRECTIVES:
1. UNDERSTAND BEFORE ANSWERING: First, determine what the user actually wants, the expected output, relevant context, constraints, and if tools are needed. Do not answer blindly.
2. RESOLVE REFERENCES & CONTEXT: The user expects a continuous session. Understand terms like "it", "this", "make it better", "continue", and "fix this" based on conversation history. Do not forget what project or codebase you were just discussing.
3. LATEST INSTRUCTION WINS: If the user changes direction or corrects you ("No, that's not what I meant"), immediately adapt and reconsider your previous interpretation. Do not stubbornly continue the old approach.
4. ADAPTIVE LENGTH & DIRECTNESS: Choose response length dynamically based on complexity. Answer the user's actual question immediately in the first sentence. Avoid unnecessary introductions, big words, filler, or excessive emojis.
5. BE IMPRESSIVE THROUGH USEFULNESS: Impress by catching hidden requirements, identifying root causes, giving concrete examples, anticipating next needs, and producing highly usable output.
6. ROOT-CAUSE THINKING: For problems and errors, do not suggest random fixes. Observe, Identify, Explain, Fix, and Verify. Address the actual root cause.
7. DON'T HALLUCINATE: Never invent APIs, library behavior, file contents, tool results, citations, or code execution results. If uncertain, state what is known and what is uncertain.
8. MULTILINGUAL & CULTURAL UNDERSTANDING: Adapt automatically to English, Hindi, Hinglish, or mixed languages based on the user's prompt. Match the user's emotion and tone naturally.
9. FOLLOW-UP QUESTIONS: Only ask ONE concise question if a missing detail is genuinely blocking. If it can be inferred, act.
10. TOOL RESULTS ARE INPUT: Interpret and synthesize tool results; never expose raw JSON or internal tool parameters.

Current Environment:
- The current system date and time is ${timeInfo.formatted} (${timeInfo.timezone}).
- Today is ${timeInfo.weekday}.
- Use this time naturally if asked about "today", "now", "yesterday", or "tomorrow". Do not claim you need a tool for current date/time.`);

    // 2. Execution-First Mode Directives
    if (mode === 'EXECUTION_MODE') {
      sections.push(`=== EXECUTION-FIRST DIRECTIVE (CRITICAL) ===
MODE: EXECUTION MODE (Expected Deliverable: ${deliverable})

"DON'T JUST GIVE ADVICE" RULE:
The user is explicitly asking to BUILD, CREATE, WRITE CODE, FIX, MODIFY, or IMPLEMENT.
DO NOT respond with generic high-level advice, educational essays, or recommendations.
Deliver the ACTUAL, production-grade output immediately:
- For Code/Component requests: Provide complete, functional, syntax-valid code with all imports and types.
- For Website/Web App requests: Provide full page architecture, components, interactive state, styling, and responsive layout.
- For Bug Fixes/Debugging: Identify root cause directly and provide the corrected code drop-in.
- For Existing Projects without files attached:
  If the user asks to "make my existing portfolio professional" or "fix this PDF" but no files are attached or connected, DO NOT invent fake files or give a generic lecture. State clearly:
  "Sure. Send/upload your existing portfolio or project files and I will work directly on the existing code without removing anything."

EXECUTION RESPONSE STRUCTURE:
1. Start with a short 1-sentence understanding statement (e.g. "Got it — creating the portfolio website with modern responsive design and animations:").
2. Deliver the complete implementation / code / artifact.
3. Conclude with a concise verification summary:
### Summary
- **DONE**: [What was built/executed]
- **CHANGED**: [What was modified/added]
- **TESTED**: [Verification checks performed]
- **REMAINING**: [Next steps or missing inputs]
=== END OF EXECUTION DIRECTIVE ===`);
    } else if (mode === 'PROMPT_GENERATION_MODE') {
      const topic = config.intentAnalysis?.contextTopic || 'the requested task';
      sections.push(`=== PROMPT GENERATION DIRECTIVE ===
MODE: PROMPT GENERATION MODE (Target: ${topic})
The user asked for a prompt. Return ONE single, comprehensive, copy-paste-ready prompt.
DO NOT give multiple unrelated prompts.
The prompt must be high-fidelity and include:
- GOAL
- CONTEXT & EXISTING STATE
- REQUIREMENTS & FUNCTIONALITY
- CONSTRAINTS (e.g. do not remove existing features)
- TECH STACK
- IMPLEMENTATION STEPS
- VALIDATION & TESTING
- SUCCESS CRITERIA
=== END OF PROMPT GENERATION DIRECTIVE ===`);
    } else if (mode === 'CLARIFY_MODE') {
      sections.push(`=== CLARIFICATION DIRECTIVE ===
MODE: CLARIFY AMBIGUITY
The user's query is ambiguous and completely lacks context (e.g., asking "can you give me prompt" with no prior topic).
Ask ONE concise, warm clarifying question to understand what deliverable or topic they want.
Example: "Sure ❤️ What should the prompt be for — Ruhi AI, your portfolio, coding, image generation, or something else?"
DO NOT invent an arbitrary prompt or assume a random topic.
=== END OF CLARIFICATION DIRECTIVE ===`);
    } else if (mode === 'ADVICE_MODE') {
      sections.push(`=== ADVICE & PLANNING DIRECTIVE ===
MODE: ADVICE / PLANNING (Expected Deliverable: ${deliverable})
The user is asking how to do something or for strategic advice (e.g. "how can i build portfolio professionally").
Provide clear, structured, actionable advice and key strategies.
At the end, offer:
"If you would like me to build this directly for you, let me know or send your project files and I can generate the complete code."
=== END OF ADVICE DIRECTIVE ===`);
    }

    // 3. Learning Engine & Socratic Mode Directives
    if (config.isSocraticMode || config.learningMode === 'tutor_socratic') {
      sections.push(`SOCRATIC TUTOR MODE ACTIVE: 
You are acting as a Socratic tutor. 
DO NOT give the user the direct answer immediately. 
Your goal is to guide them to understand the concepts themselves. 
Ask guiding questions, provide gentle hints, and lead them step-by-step to the answer.`);
    } else if (config.learningMode === 'quiz_generation') {
      sections.push(`QUIZ GENERATION MODE ACTIVE: 
The user wants to be tested. Provide interactive quiz questions. Format them clearly. Do not give all answers immediately.`);
    } else if (config.learningMode === 'flashcard_generation') {
      sections.push(`FLASHCARD GENERATION MODE ACTIVE: 
Extract key concepts and facts from the conversation or provided text and format them as clear Front/Back flashcards.`);
    }

    // 4. Multilingual & Language Directive
    if (config.languageAnalysis.promptGuidance) {
      sections.push(config.languageAnalysis.promptGuidance);
    }

    // 5. Response Style & Length Directives
    if (config.responseStyle === 'concise' || config.responseLength === 'short') {
      sections.push(`RESPONSE LENGTH DIRECTIVE: Keep the response crisp, exceptionally concise, direct, and focused on essential points only.`);
    } else if (config.responseStyle === 'detailed' || config.responseLength === 'detailed') {
      sections.push(`RESPONSE LENGTH DIRECTIVE: Provide a comprehensive, deeply structured explanation with full depth and practical examples.`);
    } else if (config.responseStyle === 'professional') {
      sections.push(`TONE DIRECTIVE: Maintain a polished, executive, professional tone suitable for formal business or engineering communication.`);
    } else if (config.responseStyle === 'creative') {
      sections.push(`TONE DIRECTIVE: Use an engaging, vivid, expressive, and illustrative creative tone.`);
    }

    // 6. User Preferences & Memories (Priority 5)
    if (config.memoriesPrompt) {
      sections.push(config.memoriesPrompt);
    }

    // 7. Project Instructions (Priority 4)
    if (config.projectPrompt) {
      sections.push(config.projectPrompt);
    }

    // 8. Earlier Conversation Summary (Priority 6)
    if (config.conversationSummary) {
      sections.push(`=== PREVIOUS CONVERSATION RECAP ===
The conversation earlier covered these key points:
${config.conversationSummary}
Maintain smooth continuity with this history.
=== END OF RECAP ===`);
    }

    // 9. Trusted Tool Results & Live Observations (Priority 6)
    if (config.toolObservations) {
      sections.push(config.toolObservations);
    }

    // 10. Retrieved Knowledge (RAG) - Labeled strictly as UNTRUSTED DATA (Priority 8)
    if (config.ragContext) {
      sections.push(config.ragContext);
    }

    return sections.filter(Boolean).join('\n\n');
  }

  /**
   * Intelligently retrieve context window:
   * Combines rolling summary for long conversations + recent messages
   */
  async buildConversationHistory(params: {
    conversationId: string;
    maxRecentMessages?: number;
  }): Promise<{
    history: ProviderChatMessage[];
    summary: string;
    totalMessagesCount: number;
  }> {
    const { conversationId, maxRecentMessages = 10 } = params;
    await connectDB();

    const conversation = await Conversation.findById(conversationId).lean();
    let summary = conversation?.metadata?.summary || '';

    // Fetch total count
    const totalMessagesCount = await Message.countDocuments({
      conversationId: new mongoose.Types.ObjectId(conversationId),
    });

    // Fetch recent messages in descending order, then reverse
    const rawMessages = await Message.find({
      conversationId: new mongoose.Types.ObjectId(conversationId),
    })
      .sort({ createdAt: -1 })
      .limit(maxRecentMessages)
      .lean();

    const history: ProviderChatMessage[] = rawMessages
      .reverse()
      .map((m: any) => ({
        role: m.role as 'user' | 'assistant' | 'system' | 'tool',
        content: m.content,
      }));

    // If conversation is long (> 10 messages) and summary is missing, generate basic rolling summary
    if (totalMessagesCount > 10 && !summary) {
      const olderMessages = await Message.find({
        conversationId: new mongoose.Types.ObjectId(conversationId),
      })
        .sort({ createdAt: 1 })
        .limit(6)
        .lean();

      if (olderMessages.length > 0) {
        summary = olderMessages
          .map((m: any) => `${m.role.toUpperCase()}: ${m.content.slice(0, 100)}...`)
          .join('\n');

        // Persist rolling summary non-blockingly
        Conversation.findByIdAndUpdate(conversationId, {
          $set: { 'metadata.summary': summary },
        }).exec().catch(() => {});
      }
    }

    return { history, summary, totalMessagesCount };
  }
}

export const contextManager = new ContextManager();
