export type UserIntent =
  | 'greeting'
  | 'math_calculation'
  | 'current_information'
  | 'news'
  | 'deep_research'
  | 'data_analysis'
  | 'memory_command'
  | 'document_qa'
  | 'coding'
  | 'writing'
  | 'comparison'
  | 'general_chat';

export type ExecutionMode =
  | 'ANSWER_MODE'
  | 'ADVICE_MODE'
  | 'EXECUTION_MODE'
  | 'PROMPT_GENERATION_MODE'
  | 'CLARIFY_MODE';

export type DetailedIntent =
  | 'ANSWER'
  | 'EXPLAIN'
  | 'ADVISE'
  | 'PLAN'
  | 'GENERATE_PROMPT'
  | 'WRITE'
  | 'CODE'
  | 'DEBUG'
  | 'EDIT'
  | 'REFACTOR'
  | 'CREATE_ARTIFACT'
  | 'CREATE_WEBSITE'
  | 'CREATE_APPLICATION'
  | 'ANALYZE_FILE'
  | 'ANALYZE_IMAGE'
  | 'RESEARCH'
  | 'WEB_SEARCH'
  | 'EXECUTE_ACTION'
  | 'AUTOMATE'
  | 'COMPARE'
  | 'BRAINSTORM'
  | 'TRANSLATE'
  | 'SUMMARIZE'
  | 'CONTINUE_PREVIOUS_TASK'
  | 'CLARIFY';

export type ExpectedDeliverable =
  | 'explanation'
  | 'answer'
  | 'prompt'
  | 'code'
  | 'complete_file'
  | 'document'
  | 'pdf'
  | 'docx'
  | 'xlsx'
  | 'pptx'
  | 'csv'
  | 'image'
  | 'diagram'
  | 'website'
  | 'web_app'
  | 'dashboard'
  | 'component'
  | 'api'
  | 'database_schema'
  | 'architecture'
  | 'research_report'
  | 'plan'
  | 'automation'
  | 'edited_file'
  | 'deployed_application'
  | 'clarification';

export interface MemoryAction {
  type: 'create' | 'delete' | 'query';
  content?: string;
  category?: 'preference' | 'instruction' | 'fact' | 'project';
}

export interface IntentContextOptions {
  hasAttachments?: boolean;
  conversationHistory?: Array<{ role: string; content: string }>;
  conversationSummary?: string;
  hasProject?: boolean;
}

export interface IntentAnalysis {
  primaryIntent: UserIntent;
  detailedIntent: DetailedIntent;
  executionMode: ExecutionMode;
  expectedDeliverable: ExpectedDeliverable;
  confidence: number;
  actionVerbsDetected: string[];
  contextTopic?: string;
  requiresLiveSearch: boolean;
  requiresCalculator: boolean;
  requiresRag: boolean;
  hasFilesOrContext: boolean;
  needsClarification: boolean;
  clarificationMessage?: string;
  executionStatement?: string;
  missingRequiredFiles?: boolean;
  fileRequestMessage?: string;
  memoryAction?: MemoryAction;
  mathExpression?: string;
  searchQueries?: string[];
  newsTopic?: {
    topic: string;
    region?: string;
    category?: string;
  };
}

// 1. Memory command patterns
const REMEMBER_PATTERNS = [
  /^(?:please\s+)?remember\s+(?:that\s+)?(.+)/i,
  /^(?:mujhe\s+)?yaad\s+rakhna\s+ki\s+(.+)/i,
  /^(?:keep in mind|note down|save this preference)[:\s]+(.+)/i,
];

const FORGET_PATTERNS = [
  /^(?:please\s+)?forget\s+(?:that\s+)?(?:preference|fact|item|memory)?(?:\s*[:\-]\s*)?(.+)?/i,
  /^delete\s+(?:my\s+)?(?:memory|preference)\s*(.*)/i,
  /^(?:mujhe\s+)?ye\s+(?:preference\s+)?bhool\s+jao/i,
];

const QUERY_MEMORY_PATTERNS = [
  /what\s+do\s+you\s+remember\s+about\s+me/i,
  /show\s+my\s+memories/i,
  /what\s+are\s+my\s+preferences/i,
  /mere\s+baare\s+mein\s+kya\s+yaad\s+hai/i,
];

// 2. Math calculation patterns
const MATH_EXPRESSION_PATTERN = /^(?:calculate|compute|solve|what is|evaluate)?\s*[:\s]*([\d\s+\-*/%^().,xX×÷]+)$/i;
const INLINE_CALC_TRIGGER = /\b(?:calculate|compute)\s+([0-9\s+\-*/%^().xX×÷]{3,})/i;

// 3. News & Current patterns
const NEWS_PATTERNS = [
  /(?:latest|today'?s|recent|breaking)\s+news/i,
  /what\s+happened\s+(?:in|with|to)?\s*(.*?)\s*(?:today|this week|recently)\??$/i,
  /news\s+(?:today|now|update)/i,
  /aaj\s+ki\s+(?:taza\s+)?khabar/i,
];

const CURRENT_INFO_PATTERNS = [
  /\blatest\s+(?:gemini|gpt|claude|deepseek|ai|model|version|release|update|framework|phone|iphone|macbook)\b/i,
  /\bcurrent\s+(?:price|rate|ceo|president|prime minister|score|weather|status)\b/i,
  /\bwho\s+won\s+(?:today|the match|yesterday)\b/i,
  /\bwhat\s+is\s+the\s+latest\s+/i,
  /\bcurrent\s+(?:bitcoin|btc|eth|crypto|stock|dollar|inr)\s+price\b/i,
  /\b(abhi|latest|aaj)\s+(?:kya\s+naya|update|chal\s+raha)\b/i,
];

// 4. Document QA patterns
const DOCUMENT_PATTERNS = [
  /\bpage\s+\d+\b/i,
  /\bin\s+(?:the|this|my)\s+(?:document|pdf|file|paper|report|contract)\b/i,
  /\bwhat\s+does\s+(?:page\s+\d+|the\s+document)\s+say\b/i,
  /\baccording\s+to\s+the\s+(?:document|pdf|file)\b/i,
];

// 5. Action Verbs
const ACTION_VERBS_REGEX = /\b(build|create|make|generate|write|develop|code|fix|debug|modify|edit|upgrade|improve|design|implement|add|remove|convert|analyze|analyse|prepare|export|download|deploy|publish|connect|send|schedule|automate)\b/gi;

/**
 * Extracts action verbs present in the text
 */
function extractActionVerbs(text: string): string[] {
  const matches = text.match(ACTION_VERBS_REGEX);
  if (!matches) return [];
  return Array.from(new Set(matches.map((v) => v.toLowerCase())));
}

/**
 * Detect context topic from previous conversation history
 */
function extractTopicFromHistory(
  history: Array<{ role: string; content: string }>,
  summary?: string
): string | undefined {
  if (summary) {
    if (/ruhi/i.test(summary)) return 'Ruhi AI';
    if (/portfolio/i.test(summary)) return 'portfolio';
    if (/login|auth/i.test(summary)) return 'authentication system';
    if (/react|next/i.test(summary)) return 'React/Next.js application';
  }

  // Inspect the last 4 messages in reverse
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    const text = msg.content.toLowerCase();
    if (text.includes('ruhi')) return 'Ruhi AI';
    if (text.includes('portfolio')) return 'portfolio';
    if (text.includes('login') || text.includes('auth')) return 'authentication system';
    if (text.includes('landing page') || text.includes('website')) return 'website';
    if (text.includes('python') || text.includes('script') || text.includes('scraping')) return 'Python script';
    if (text.includes('docker') || text.includes('kubernetes')) return 'DevOps/deployment';
  }

  return undefined;
}

export function detectIntent(
  content: string,
  optionsOrHasAttachments?: boolean | IntentContextOptions
): IntentAnalysis {
  const text = content.trim();

  // Normalize options
  let hasAttachments = false;
  let conversationHistory: Array<{ role: string; content: string }> = [];
  let conversationSummary: string | undefined;
  let hasProject = false;

  if (typeof optionsOrHasAttachments === 'boolean') {
    hasAttachments = optionsOrHasAttachments;
  } else if (optionsOrHasAttachments && typeof optionsOrHasAttachments === 'object') {
    hasAttachments = Boolean(optionsOrHasAttachments.hasAttachments);
    conversationHistory = optionsOrHasAttachments.conversationHistory || [];
    conversationSummary = optionsOrHasAttachments.conversationSummary;
    hasProject = Boolean(optionsOrHasAttachments.hasProject);
  }

  const actionVerbs = extractActionVerbs(text);
  const contextTopic = extractTopicFromHistory(conversationHistory, conversationSummary);

  // 1. Check Memory Commands
  for (const pattern of QUERY_MEMORY_PATTERNS) {
    if (pattern.test(text)) {
      return {
        primaryIntent: 'memory_command',
        detailedIntent: 'ANSWER',
        executionMode: 'ANSWER_MODE',
        expectedDeliverable: 'answer',
        confidence: 0.98,
        actionVerbsDetected: actionVerbs,
        requiresLiveSearch: false,
        requiresCalculator: false,
        requiresRag: false,
        hasFilesOrContext: false,
        needsClarification: false,
        memoryAction: { type: 'query' },
      };
    }
  }

  for (const pattern of FORGET_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        primaryIntent: 'memory_command',
        detailedIntent: 'EXECUTE_ACTION',
        executionMode: 'EXECUTION_MODE',
        expectedDeliverable: 'answer',
        confidence: 0.95,
        actionVerbsDetected: actionVerbs,
        requiresLiveSearch: false,
        requiresCalculator: false,
        requiresRag: false,
        hasFilesOrContext: false,
        needsClarification: false,
        memoryAction: {
          type: 'delete',
          content: match[1]?.trim() || 'preference',
        },
      };
    }
  }

  for (const pattern of REMEMBER_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        primaryIntent: 'memory_command',
        detailedIntent: 'EXECUTE_ACTION',
        executionMode: 'EXECUTION_MODE',
        expectedDeliverable: 'answer',
        confidence: 0.96,
        actionVerbsDetected: actionVerbs,
        requiresLiveSearch: false,
        requiresCalculator: false,
        requiresRag: false,
        hasFilesOrContext: false,
        needsClarification: false,
        memoryAction: {
          type: 'create',
          content: match[1].trim(),
          category: 'preference',
        },
      };
    }
  }

  // 2. Math Calculations
  const inlineCalc = text.match(INLINE_CALC_TRIGGER);
  if (inlineCalc) {
    const expr = inlineCalc[1].replace(/×/g, '*').replace(/÷/g, '/').replace(/x/gi, '*').trim();
    return {
      primaryIntent: 'math_calculation',
      detailedIntent: 'ANSWER',
      executionMode: 'ANSWER_MODE',
      expectedDeliverable: 'answer',
      confidence: 0.95,
      actionVerbsDetected: actionVerbs,
      requiresLiveSearch: false,
      requiresCalculator: true,
      requiresRag: false,
      hasFilesOrContext: false,
      needsClarification: false,
      mathExpression: expr,
    };
  }

  const pureMathMatch = text.replace(/[.?]$/, '').match(MATH_EXPRESSION_PATTERN);
  if (pureMathMatch && /[\d]/.test(pureMathMatch[1]) && /[+\-*/%^xX×÷]/.test(pureMathMatch[1])) {
    const expr = pureMathMatch[1].replace(/×/g, '*').replace(/÷/g, '/').replace(/x/gi, '*').trim();
    return {
      primaryIntent: 'math_calculation',
      detailedIntent: 'ANSWER',
      executionMode: 'ANSWER_MODE',
      expectedDeliverable: 'answer',
      confidence: 0.95,
      actionVerbsDetected: actionVerbs,
      requiresLiveSearch: false,
      requiresCalculator: true,
      requiresRag: false,
      hasFilesOrContext: false,
      needsClarification: false,
      mathExpression: expr,
    };
  }

  // 3. Document QA (e.g. "What does page 15 say?")
  const isDocQuery = DOCUMENT_PATTERNS.some((p) => p.test(text));
  const isExecutionOnAttachment = actionVerbs.some((v) =>
    ['build', 'create', 'make', 'fix', 'debug', 'edit', 'modify', 'upgrade', 'improve', 'code', 'develop'].includes(v)
  );

  if (isDocQuery || (hasAttachments && !isExecutionOnAttachment)) {
    return {
      primaryIntent: 'document_qa',
      detailedIntent: 'ANALYZE_FILE',
      executionMode: 'ANSWER_MODE',
      expectedDeliverable: 'answer',
      confidence: 0.9,
      actionVerbsDetected: actionVerbs,
      requiresLiveSearch: false,
      requiresCalculator: false,
      requiresRag: true,
      hasFilesOrContext: hasAttachments,
      needsClarification: false,
    };
  }

  // 4. Greetings
  if (/^(hi|hello|hey|namaste|salaam|good\s+(?:morning|afternoon|evening))\s*(?:ruhi)?(?:!|\.)?$/i.test(text)) {
    return {
      primaryIntent: 'greeting',
      detailedIntent: 'ANSWER',
      executionMode: 'ANSWER_MODE',
      expectedDeliverable: 'answer',
      confidence: 0.99,
      actionVerbsDetected: [],
      requiresLiveSearch: false,
      requiresCalculator: false,
      requiresRag: false,
      hasFilesOrContext: false,
      needsClarification: false,
    };
  }

  // =========================================================================
  // 5. PROMPT GENERATION vs AMBIGUITY CLARIFICATION (Test A, Test B, Test E)
  // =========================================================================
  const isPromptRequest = /\b(?:give|write|generate|provide|create)\s+(?:me\s+)?(?:a\s+)?prompt\b/i.test(text) ||
    /^(?:can\s+you\s+)?(?:give|send|write)\s+(?:me\s+)?(?:a\s+)?prompt(?:\s+please|\s+yaar)?\??$/i.test(text);

  if (isPromptRequest) {
    // Check if user specified the prompt target inside the prompt itself:
    // e.g. "give me prompt to build my portfolio", "prompt for ruhi ai", "prompt for python scraper"
    const explicitTargetMatch = text.match(/(?:prompt\s+(?:to|for|about)\s+)(.+)/i);
    const explicitTarget = explicitTargetMatch ? explicitTargetMatch[1].replace(/[.?]$/, '').trim() : undefined;

    const resolvedTopic = explicitTarget || contextTopic;

    if (resolvedTopic) {
      // Clear topic known (either from current prompt or prior conversation history)
      return {
        primaryIntent: 'writing',
        detailedIntent: 'GENERATE_PROMPT',
        executionMode: 'PROMPT_GENERATION_MODE',
        expectedDeliverable: 'prompt',
        contextTopic: resolvedTopic,
        confidence: 0.96,
        actionVerbsDetected: actionVerbs,
        requiresLiveSearch: false,
        requiresCalculator: false,
        requiresRag: false,
        hasFilesOrContext: Boolean(contextTopic || hasAttachments),
        needsClarification: false,
        executionStatement: `Got it — here is a production-grade, copy-paste-ready prompt designed for ${resolvedTopic}:`,
      };
    } else {
      // Naked, ambiguous "can you give me prompt" with NO previous context -> TEST A
      return {
        primaryIntent: 'general_chat',
        detailedIntent: 'CLARIFY',
        executionMode: 'CLARIFY_MODE',
        expectedDeliverable: 'clarification',
        confidence: 0.98,
        actionVerbsDetected: actionVerbs,
        requiresLiveSearch: false,
        requiresCalculator: false,
        requiresRag: false,
        hasFilesOrContext: false,
        needsClarification: true,
        clarificationMessage: 'Sure ❤️ What should the prompt be for — Ruhi AI, your portfolio, coding, image generation, or something else?',
      };
    }
  }

  // =========================================================================
  // 6. ADVICE / PLANNING MODE vs EXECUTION MODE
  // =========================================================================
  
  // A. Advice questions: "how can i build...", "how to make...", "how do i make...", "what steps to..."
  const isAdviceQuestion = /^(?:how\s+(?:can|do|should|to|would)\s+i|what\s+is\s+the\s+best\s+way\s+to|guide\s+me\s+on\s+how\s+to|tips\s+(?:for|to))\s+/i.test(text);

  if (isAdviceQuestion) {
    return {
      primaryIntent: 'general_chat',
      detailedIntent: 'ADVISE',
      executionMode: 'ADVICE_MODE',
      expectedDeliverable: 'plan',
      confidence: 0.92,
      actionVerbsDetected: actionVerbs,
      requiresLiveSearch: false,
      requiresCalculator: false,
      requiresRag: false,
      hasFilesOrContext: hasAttachments || hasProject,
      needsClarification: false,
    };
  }

  // B. Pure Definitional / Explanation Questions: "What is a portfolio?", "What is recursion?"
  if (/^what\s+is\s+(?:an?|the)?\s*([a-zA-Z0-9\s]+)\??$/i.test(text) && !text.includes('latest') && !text.includes('today')) {
    return {
      primaryIntent: 'general_chat',
      detailedIntent: 'EXPLAIN',
      executionMode: 'ANSWER_MODE',
      expectedDeliverable: 'answer',
      confidence: 0.93,
      actionVerbsDetected: [],
      requiresLiveSearch: false,
      requiresCalculator: false,
      requiresRag: false,
      hasFilesOrContext: false,
      needsClarification: false,
    };
  }

  // =========================================================================
  // 7. EXECUTION MODE: Direct imperatives to build, code, fix, modify
  // =========================================================================

  // C. Website / Web App Creation (e.g. "build my portfolio professionally", "build me a portfolio", "create a modern portfolio website")
  if (
    /\b(?:build|create|make|develop)\s+(?:me\s+)?(?:a\s+)?(?:modern\s+|professional\s+|responsive\s+)?(?:portfolio|website|web\s*app|landing\s*page|dashboard|site)\b/i.test(text) ||
    /\b(?:build|create|make)\s+(?:my\s+)?portfolio\s+(?:professionally|for\s+me)\b/i.test(text) ||
    /^(?:create|build)\s+the\s+website\b/i.test(text)
  ) {
    return {
      primaryIntent: 'coding',
      detailedIntent: 'CREATE_WEBSITE',
      executionMode: 'EXECUTION_MODE',
      expectedDeliverable: 'website',
      confidence: 0.97,
      actionVerbsDetected: actionVerbs,
      requiresLiveSearch: false,
      requiresCalculator: false,
      requiresRag: false,
      hasFilesOrContext: hasAttachments || hasProject,
      needsClarification: false,
      executionStatement: 'Got it — I am creating a complete, modern, responsive portfolio website architecture and code for you.',
    };
  }

  // D. Modifying / Improving existing project or website:
  // e.g. "make my existing portfolio professional", "make this website better", "improve my portfolio", "don't remove anything"
  if (
    /\b(?:make|improve|upgrade|refactor)\s+(?:my\s+|this\s+)?(?:existing\s+)?(?:portfolio|website|project|code|app)\s+(?:better|more\s+professional|professional)\b/i.test(text) ||
    /\bmake\s+this\s+website\s+better\b/i.test(text) ||
    /\bmake\s+it\s+(?:more\s+)?professional\s+without\s+removing\s+anything\b/i.test(text)
  ) {
    const hasFiles = hasAttachments || hasProject;
    return {
      primaryIntent: 'coding',
      detailedIntent: 'EDIT',
      executionMode: 'EXECUTION_MODE',
      expectedDeliverable: 'edited_file',
      confidence: 0.95,
      actionVerbsDetected: actionVerbs,
      requiresLiveSearch: false,
      requiresCalculator: false,
      requiresRag: hasFiles,
      hasFilesOrContext: hasFiles,
      needsClarification: false,
      missingRequiredFiles: !hasFiles,
      fileRequestMessage: !hasFiles
        ? "Sure. Send/upload your existing portfolio or project files and I'll work directly on the existing code without removing anything."
        : undefined,
      executionStatement: hasFiles
        ? 'Got it — inspecting your existing project files and applying professional upgrades while strictly preserving all functionality.'
        : undefined,
    };
  }

  // E. Code generation and debugging: "write the code", "create a login page in React", "fix this error", "fix this login page"
  if (
    /^(?:write|give\s+me)\s+the\s+code\b/i.test(text) ||
    /\b(?:write|code|create|generate|implement)\s+(?:a\s+)?(?:login\s+page|component|api|function|service|script|server)\b/i.test(text)
  ) {
    return {
      primaryIntent: 'coding',
      detailedIntent: 'CODE',
      executionMode: 'EXECUTION_MODE',
      expectedDeliverable: 'code',
      confidence: 0.95,
      actionVerbsDetected: actionVerbs,
      requiresLiveSearch: false,
      requiresCalculator: false,
      requiresRag: false,
      hasFilesOrContext: hasAttachments || hasProject,
      needsClarification: false,
      executionStatement: 'Got it — generating the complete, production-ready code implementation:',
    };
  }

  // F. Bug fixing and debugging: "fix this error", "fix this login page", "debug this", "bhai ye fix kar"
  if (
    /\b(?:fix|debug|resolve)\s+(?:this\s+)?(?:error|bug|issue|exception|crash|login\s+page|problem|code)\b/i.test(text) ||
    /\bye\s+fix\s+kar\b/i.test(text) ||
    /\bwhy\s+is\s+this\s+not\s+working\b/i.test(text)
  ) {
    return {
      primaryIntent: 'coding',
      detailedIntent: 'DEBUG',
      executionMode: 'EXECUTION_MODE',
      expectedDeliverable: 'code',
      confidence: 0.94,
      actionVerbsDetected: actionVerbs,
      requiresLiveSearch: false,
      requiresCalculator: false,
      requiresRag: hasAttachments,
      hasFilesOrContext: hasAttachments || hasProject,
      needsClarification: false,
      executionStatement: 'Got it — diagnosing root cause and providing the verified fix:',
    };
  }

  // 8. News Intent
  for (const pattern of NEWS_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const topic = match[1]?.trim() || (text.toLowerCase().includes('ai') ? 'AI' : 'general');
      return {
        primaryIntent: 'news',
        detailedIntent: 'RESEARCH',
        executionMode: 'ANSWER_MODE',
        expectedDeliverable: 'research_report',
        confidence: 0.92,
        actionVerbsDetected: actionVerbs,
        requiresLiveSearch: true,
        requiresCalculator: false,
        requiresRag: false,
        hasFilesOrContext: false,
        needsClarification: false,
        newsTopic: {
          topic: topic || 'technology',
          category: 'news',
        },
      };
    }
  }

  // 9. Deep Research
  if (
    /\b(?:deep\s+)?research\s+(?:the\s+|on\s+|about\s+|into\s+)?/i.test(text) ||
    /\b(?:comprehensive|exhaustive)\s+research\b/i.test(text)
  ) {
    return {
      primaryIntent: 'deep_research',
      detailedIntent: 'RESEARCH',
      executionMode: 'EXECUTION_MODE',
      expectedDeliverable: 'research_report',
      confidence: 0.94,
      actionVerbsDetected: actionVerbs,
      requiresLiveSearch: true,
      requiresCalculator: false,
      requiresRag: false,
      hasFilesOrContext: false,
      needsClarification: false,
    };
  }

  // 10. Data Analysis
  if (
    /\b(?:analyze|analyse)\s+(?:this\s+)?(?:csv|excel|dataset|data|sheet|table|json|numbers)\b/i.test(text) ||
    /\b(?:create|generate)\s+a?\s*chart\s+(?:from|using|for)\s+(?:this|the)\s+data\b/i.test(text)
  ) {
    return {
      primaryIntent: 'data_analysis',
      detailedIntent: 'ANALYZE_FILE',
      executionMode: 'EXECUTION_MODE',
      expectedDeliverable: 'dashboard',
      confidence: 0.93,
      actionVerbsDetected: actionVerbs,
      requiresLiveSearch: false,
      requiresCalculator: true,
      requiresRag: false,
      hasFilesOrContext: hasAttachments,
      needsClarification: false,
    };
  }

  // 11. Current Information
  if (CURRENT_INFO_PATTERNS.some((p) => p.test(text))) {
    return {
      primaryIntent: 'current_information',
      detailedIntent: 'WEB_SEARCH',
      executionMode: 'ANSWER_MODE',
      expectedDeliverable: 'answer',
      confidence: 0.91,
      actionVerbsDetected: actionVerbs,
      requiresLiveSearch: true,
      requiresCalculator: false,
      requiresRag: false,
      hasFilesOrContext: false,
      needsClarification: false,
    };
  }

  // 12. General Coding
  if (
    /\b(code|function|bug|error|exception|debug|syntax|typescript|javascript|python|java|c\+\+|react|nextjs)\b/i.test(text) ||
    /```[\s\S]*```/.test(text) ||
    /ye code kyun nahi chal raha/i.test(text)
  ) {
    return {
      primaryIntent: 'coding',
      detailedIntent: 'CODE',
      executionMode: 'EXECUTION_MODE',
      expectedDeliverable: 'code',
      confidence: 0.88,
      actionVerbsDetected: actionVerbs,
      requiresLiveSearch: false,
      requiresCalculator: false,
      requiresRag: false,
      hasFilesOrContext: hasAttachments,
      needsClarification: false,
    };
  }

  // 13. Writing
  if (/\b(write\s+(?:an?\s+)?(?:email|letter|essay|story|poem|cover letter|proposal))\b/i.test(text)) {
    return {
      primaryIntent: 'writing',
      detailedIntent: 'WRITE',
      executionMode: 'EXECUTION_MODE',
      expectedDeliverable: 'document',
      confidence: 0.88,
      actionVerbsDetected: actionVerbs,
      requiresLiveSearch: false,
      requiresCalculator: false,
      requiresRag: false,
      hasFilesOrContext: false,
      needsClarification: false,
    };
  }

  // 14. Comparison
  if (/\b(?:vs|versus|compare|difference between)\b/i.test(text)) {
    return {
      primaryIntent: 'comparison',
      detailedIntent: 'COMPARE',
      executionMode: 'ANSWER_MODE',
      expectedDeliverable: 'explanation',
      confidence: 0.85,
      actionVerbsDetected: actionVerbs,
      requiresLiveSearch: false,
      requiresCalculator: false,
      requiresRag: false,
      hasFilesOrContext: false,
      needsClarification: false,
    };
  }

  // Fallback: If strong action verbs exist (create, build, fix, etc.), default to EXECUTION_MODE
  const hasStrongAction = actionVerbs.some((v) =>
    ['build', 'create', 'make', 'generate', 'write', 'fix', 'debug', 'implement', 'modify'].includes(v)
  );

  if (hasStrongAction) {
    return {
      primaryIntent: 'general_chat',
      detailedIntent: 'EXECUTE_ACTION',
      executionMode: 'EXECUTION_MODE',
      expectedDeliverable: 'code',
      confidence: 0.82,
      actionVerbsDetected: actionVerbs,
      requiresLiveSearch: false,
      requiresCalculator: false,
      requiresRag: false,
      hasFilesOrContext: hasAttachments || hasProject,
      needsClarification: false,
    };
  }

  // Default General Chat
  return {
    primaryIntent: 'general_chat',
    detailedIntent: 'ANSWER',
    executionMode: 'ANSWER_MODE',
    expectedDeliverable: 'answer',
    confidence: 0.8,
    actionVerbsDetected: [],
    requiresLiveSearch: false,
    requiresCalculator: false,
    requiresRag: false,
    hasFilesOrContext: false,
    needsClarification: false,
  };
}
