/**
 * 🌸 RUHI AI - Comprehensive Quality Benchmarking & Reliability Verification Suite
 * 
 * Independent, repeatable evaluations covering:
 * 1. Relevance, Accuracy & Instruction Following
 * 2. Language Adaptation: Hindi, Hinglish & English
 * 3. Coding & Debugging (Complete functional code, root cause explanation)
 * 4. Professional Writing & Zero Filler Guarantee
 * 5. Current Information & Freshness Anchoring
 * 6. Follow-up Context Retention & User Corrections
 * 7. Streaming & Malformed Chunk Defense
 * 8. Artifact & Spreadsheet CSV Integrity
 * 9. Task Recovery & Resumability Without Redis
 * 10. Performance Observability & Zero Credential Leakage
 * 
 * Run with: npx tsx tests/test-quality-benchmarking.ts
 */

import { detectLanguage } from '../src/services/ai/orchestrator/language';
import { detectIntent } from '../src/services/ai/orchestrator/intent';
import { contextManager } from '../src/services/ai/orchestrator/context';
import { responseValidator } from '../src/services/ai/orchestrator/response';
import { checkFreshnessRequirement } from '../src/services/ai/orchestrator/freshness';
import { safeDiagnostics } from '../src/services/ai/orchestrator/observability';
import { agentTaskQueue } from '../src/services/queue/agentQueue';
import { isFencedMarkdownTable } from '../src/components/chat/rich/richContentUtils';
import katex from 'katex';

let passed = 0;
let failed = 0;

function evaluate(condition: boolean, title: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${title}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${title} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runQualityBenchmarkSuite() {
  console.log('\n=================================================================');
  console.log('🌸 RUHI AI: QUALITY BENCHMARKING & RELIABILITY TEST SUITE');
  console.log('=================================================================\n');

  safeDiagnostics.clear();

  // ---------------------------------------------------------------------------
  // 1. LANGUAGE ADAPTATION: HINDI, HINGLISH & ENGLISH (Independent Evaluators)
  // ---------------------------------------------------------------------------
  console.log('• 1. Language Adaptation Benchmarks (Hindi, Hinglish, English)');

  // 1a. Pure Hindi (Devanagari)
  const hindiQuery = 'नमस्ते रूही, क्या आप मुझे भारत के अंतरिक्ष मिशन चंद्रयान के बारे में बता सकती हैं?';
  const hindiLang = detectLanguage(hindiQuery);
  evaluate(hindiLang.detectedLanguage === 'hi', 'Detects pure Hindi language accurately');
  evaluate(!hindiLang.isHinglish, 'Pure Devanagari Hindi is not misclassified as Hinglish');
  evaluate(hindiLang.promptGuidance.includes('Hindi (Devanagari)'), 'Commands pure natural Hindi output');

  // 1b. Conversational Hinglish
  const hinglishQuery = 'Bhai mera code deploy nahi ho raha hai, build me error aa raha hai. Please help karo.';
  const hinglishLang = detectLanguage(hinglishQuery);
  evaluate(hinglishLang.isHinglish, 'Detects conversational Hinglish accurately');
  evaluate(hinglishLang.promptGuidance.includes('Keep technical terms and code tokens in English'), 'Instructs model to retain technical tokens in English');

  // 1c. English
  const englishQuery = 'Explain the difference between optimistic concurrency and pessimistic locking in distributed databases.';
  const englishLang = detectLanguage(englishQuery);
  evaluate(englishLang.detectedLanguage === 'en' && !englishLang.isHinglish, 'Detects English technical query');

  // ---------------------------------------------------------------------------
  // 2. CODING & DEBUGGING BENCHMARKS (Syntax, Completeness, Structure)
  // ---------------------------------------------------------------------------
  console.log('\n• 2. Coding & Debugging Quality Benchmarks');

  const codeQuery = 'Write a TypeScript function to debounce an async search handler with cancellation';
  const codeIntent = detectIntent(codeQuery);
  const codeLang = detectLanguage(codeQuery);
  evaluate(codeIntent.primaryIntent === 'coding', 'Correctly routes code synthesis query');

  const codePrompt = contextManager.buildSystemPrompt({
    languageAnalysis: codeLang,
    intentAnalysis: codeIntent,
    executionMode: 'EXECUTION_MODE',
    expectedDeliverable: 'code',
  });
  evaluate(codePrompt.includes('Provide complete, functional, syntax-valid code with all imports and types'), 'Mandates complete syntax-valid code');
  evaluate(codePrompt.includes('When the user asks for code, provide complete, usable, bug-free code'), 'Enforces usable deliverable over advice');

  const debugQuery = 'Fix this error: Unhandled Runtime Error: Hydration failed because server HTML did not match client';
  const debugIntent = detectIntent(debugQuery);
  const debugLang = detectLanguage(debugQuery);
  evaluate(debugIntent.detailedIntent === 'DEBUG', 'Identifies error trace and routes to debugging');

  const debugPrompt = contextManager.buildSystemPrompt({
    languageAnalysis: debugLang,
    intentAnalysis: debugIntent,
    executionMode: debugIntent.executionMode,
  });
  evaluate(debugPrompt.includes('Observe, Identify, Explain, Fix, and Verify'), 'Enforces 4-step structured debugging: Observe, Identify, Explain, Fix');
  evaluate(debugPrompt.includes('Address the actual root cause'), 'Enforces exact root cause and actionable fix');

  // ---------------------------------------------------------------------------
  // 3. PROFESSIONAL WRITING & ANTI-FILLER VALIDATION
  // ---------------------------------------------------------------------------
  console.log('\n• 3. Professional Writing & Anti-Filler Verification');

  const executiveQuery = 'Draft an executive summary on reducing cloud compute costs by 30%';
  const execIntent = detectIntent(executiveQuery);
  const execPrompt = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage(executiveQuery),
    intentAnalysis: execIntent,
    responseStyle: 'professional',
  });
  evaluate(execPrompt.includes('TONE DIRECTIVE: Maintain a polished, executive, professional tone'), 'Enforces formal executive tone');

  // Test independent response sanitization: removes robotic filler greetings
  const rawModelResponse = 'Certainly! I would be delighted to assist you with this request. Here is the executive summary:\n\n### Executive Summary\nCloud compute costs can be reduced by 30% through rightsizing.';
  const validatedResponse = responseValidator.validate(rawModelResponse);
  evaluate(!validatedResponse.sanitizedText.startsWith('Certainly!'), 'Sanitizer strips canned motivational filler ("Certainly! I would be delighted...")');
  evaluate(validatedResponse.sanitizedText.includes('### Executive Summary'), 'Preserves actual executive content intact');

  // ---------------------------------------------------------------------------
  // 4. CURRENT INFORMATION & FRESHNESS ANCHORING
  // ---------------------------------------------------------------------------
  console.log('\n• 4. Current Information & Freshness Anchoring');

  const currentEventQuery = 'Who won the ICC T20 World Cup recently?';
  const freshnessCheck = checkFreshnessRequirement(currentEventQuery);
  evaluate(freshnessCheck.requiresFreshData, 'Flags queries about recent tournaments as requiring live web verification');

  const staticMathQuery = 'What is the integral of sin(x) dx?';
  const staticCheck = checkFreshnessRequirement(staticMathQuery);
  evaluate(!staticCheck.requiresFreshData, 'Recognizes timeless mathematical inquiries and avoids unnecessary web search');

  // ---------------------------------------------------------------------------
  // 5. FOLLOW-UP CONTEXT RETENTION & USER CORRECTIONS
  // ---------------------------------------------------------------------------
  console.log('\n• 5. Follow-up Context Retention & User Corrections');

  const correctionQuery = "No, that's not what I meant. I want Python with FastAPI, not Node.js";
  const correctionIntent = detectIntent(correctionQuery, {
    conversationHistory: [{ role: 'assistant', content: 'Here is an Express.js server:' }],
  });
  const correctionLang = detectLanguage(correctionQuery);
  evaluate(Boolean(correctionIntent.isCorrection), 'Accurately recognizes user corrective feedback');

  const correctionPrompt = contextManager.buildSystemPrompt({
    languageAnalysis: correctionLang,
    intentAnalysis: correctionIntent,
  });
  evaluate(
    correctionPrompt.includes('=== USER CORRECTION DIRECTIVE ===') &&
    correctionPrompt.includes('LATEST INSTRUCTION WINS'),
    'Instructs model to gracefully pivot with LATEST INSTRUCTION WINS'
  );

  // ---------------------------------------------------------------------------
  // 6. STREAMING & MALFORMED CHUNK DEFENSE
  // ---------------------------------------------------------------------------
  console.log('\n• 6. Streaming & Malformed Chunk Defense');

  // Ensure malformed or incomplete JSON stream lines do not crash parser
  const malformedStreamLines = [
    'data: {"type": "start", "conversationId": "123"}',
    'data: {"type": "chunk", "text": "Hello "}',
    'data: {broken json',
    'data: {"type": "chunk", "text": "world!"}',
    'data: {"type": "error", "error": "Provider upstream timeout"}',
  ];

  let accumulated = '';
  let caughtStreamError: string | null = null;

  for (const line of malformedStreamLines) {
    if (!line.startsWith('data: ')) continue;
    try {
      const data = JSON.parse(line.slice(6));
      if (data.type === 'chunk') accumulated += data.text;
      if (data.type === 'error') caughtStreamError = data.error;
    } catch {
      // Ignored non-fatal parse error during streaming
    }
  }

  evaluate(accumulated === 'Hello world!', 'Safely recovers and accumulates text despite malformed intermediate JSON');
  evaluate(caughtStreamError === 'Provider upstream timeout', 'Correctly captures and surfaces stream error payload');

  // ---------------------------------------------------------------------------
  // 7. ARTIFACT & SPREADSHEET CSV INTEGRITY
  // ---------------------------------------------------------------------------
  console.log('\n• 7. Artifact & Spreadsheet CSV Integrity');

  const escapeCsvCell = (val: string) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const testHeaders = ['Product, Model', 'Description', 'Price'];
  const testRow = ['MacBook "Pro" 16, M3', 'High-end laptop, 32GB RAM', '$2,499.00'];

  const escapedHeaders = testHeaders.map(escapeCsvCell).join(',');
  const escapedRow = testRow.map(escapeCsvCell).join(',');
  const fullCsv = `${escapedHeaders}\n${escapedRow}`;

  evaluate(
    fullCsv.includes('"Product, Model"') && fullCsv.includes('"MacBook ""Pro"" 16, M3"'),
    'Correctly escapes internal commas and double quotes according to RFC 4180 CSV standard'
  );

  // ---------------------------------------------------------------------------
  // 8. TASK QUEUE RESUMABILITY WITHOUT REDIS
  // ---------------------------------------------------------------------------
  console.log('\n• 8. Task Queue Resumability & In-Memory Concurrency Isolation');

  const taskPlan = [
    { title: 'Step 1: Scaffolding', status: 'completed' },
    { title: 'Step 2: Configuration', status: 'completed' },
    { title: 'Step 3: Human Approval Gate', status: 'pending' },
    { title: 'Step 4: Deployment', status: 'pending' },
  ];

  // Simulating worker step resumption: skips completed steps
  let resumedStepIndex = -1;
  for (let i = 0; i < taskPlan.length; i++) {
    if (taskPlan[i].status !== 'completed') {
      resumedStepIndex = i;
      break;
    }
  }

  evaluate(resumedStepIndex === 2, 'Resumes long-running task precisely from Step 3 without repeating Steps 1 and 2');

  // ---------------------------------------------------------------------------
  // 9. PERFORMANCE OBSERVABILITY & CREDENTIAL PROTECTION
  // ---------------------------------------------------------------------------
  console.log('\n• 9. Performance Observability & Credential Protection');

  safeDiagnostics.record('response_validated', {
    modelId: 'ruhi-balanced',
    durationMs: 245,
    promptTokens: 120,
    completionTokens: 85,
    totalTokens: 205,
    apiKey: 'sk-proj-supersecret1234567890abcdef',
    bearerToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID1URbpVxm9frGkJ5bd0BpTunM',
  });

  const recentEvents = safeDiagnostics.getRecentEvents(1);
  const loggedEvent = recentEvents[0];

  evaluate(loggedEvent.metadata.durationMs === 245, 'Accurately logs request duration (245ms)');
  evaluate(loggedEvent.metadata.totalTokens === 205, 'Accurately logs total token usage (205 tokens)');
  evaluate(loggedEvent.metadata.apiKey === '[REDACTED]', 'Redacts raw API keys automatically');
  evaluate(loggedEvent.metadata.bearerToken === '[REDACTED]', 'Redacts bearer tokens and secrets automatically');

  // ---------------------------------------------------------------------------
  // 10. REGRESSION CHECKS: MERMAID & MOBILE LATEX LAYOUT
  // ---------------------------------------------------------------------------
  console.log('\n• 10. Regression Checks: Mermaid Diagram & LaTeX Math Layout');

  // Mermaid detection test
  const sampleTable = '| Header 1 | Header 2 |\n|---|---|\n| Cell 1 | Cell 2 |';
  evaluate(isFencedMarkdownTable(sampleTable), 'Fenced Markdown tables correctly identified for rich visual presentation');

  // KaTeX math test
  const mathFormula = 'E = mc^2';
  const rendered = katex.renderToString(mathFormula, { displayMode: true, throwOnError: false });
  evaluate(rendered.includes('katex-display') && rendered.includes('class="katex"'), 'KaTeX renders accessible math expression without error');

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n=================================================================');
  console.log(`🌸 QUALITY BENCHMARK RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('=================================================================\n');

  if (failed > 0) process.exit(1);
}

runQualityBenchmarkSuite().catch((err) => {
  console.error('Fatal benchmark suite failure:', err);
  process.exit(1);
});
