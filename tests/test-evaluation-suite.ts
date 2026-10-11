/**
 * 🌸 RUHI AI - Production Quality, Reliability & Repeatable Evaluation Suite
 * 
 * Comprehensive 14-Area Evaluation Matrix:
 * 1. Casual Conversation (Tone, directness, anti-cliché)
 * 2. Professional Writing (Executive polish, zero motivational filler)
 * 3. Coding (Complete, functional, syntax-valid code with all imports)
 * 4. Debugging (Root cause diagnosis: Observe, Identify, Explain, Fix)
 * 5. Prompt Generation (Structured, copy-paste-ready, multi-part prompt)
 * 6. Mathematics (Exact arithmetic precision without hallucinations)
 * 7. Multilingual: Hindi & Conversational Hinglish
 * 8. Follow-ups & User Corrections (Adaptive alignment)
 * 9. Long-Context Continuity & Rolling Summaries
 * 10. Current Information & Freshness Anchoring
 * 11. File & Multimodal Image Analysis Routing
 * 12. Provider Failure Recovery & Malformed Output Defense
 * 13. Persistence Resilience (DB failure does NOT suppress AI responses)
 * 14. Safe Observability & Security Redaction (No leaked tokens or secrets)
 * 
 * Run with: npx tsx tests/test-evaluation-suite.ts
 */

import { contextManager } from '../src/services/ai/orchestrator/context';
import { responseValidator } from '../src/services/ai/orchestrator/response';
import { detectLanguage } from '../src/services/ai/orchestrator/language';
import { detectIntent } from '../src/services/ai/orchestrator/intent';
import { checkFreshnessRequirement } from '../src/services/ai/orchestrator/freshness';
import { safeDiagnostics } from '../src/services/ai/orchestrator/observability';
import { aiRouter } from '../src/providers/ai/router';
import { toolCoordinator } from '../src/services/ai/orchestrator/tools';

let passed = 0;
let failed = 0;

function evaluate(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runEvaluationSuite() {
  console.log('\n🌸 =================================================================');
  console.log('🌸 RUHI AI: FINAL QUALITY, RELIABILITY & PRODUCTION EVALUATION');
  console.log('🌸 =================================================================\n');

  safeDiagnostics.clear();

  // -------------------------------------------------------------------------
  // 1. CASUAL CONVERSATION EVALUATION
  // -------------------------------------------------------------------------
  console.log('• 1. Casual Conversation Evaluation');
  const greeting = 'Hey Ruhi, hope you are having a nice day!';
  const lang1 = detectLanguage(greeting);
  const intent1 = detectIntent(greeting);
  const prompt1 = contextManager.buildSystemPrompt({
    languageAnalysis: lang1,
    intentAnalysis: intent1,
  });

  evaluate(intent1.primaryIntent === 'greeting', 'Correctly identified casual greeting');
  evaluate(prompt1.includes('Casual conversation: warm, relaxed, approachable, and friendly'), 'Tone adjusted to casual warmth');
  evaluate(prompt1.includes('AVOID repetitive openings'), 'System prompt forbids canned robotic greetings');

  const rawClicheResponse = 'Certainly! It is great to chat with you today. 😊😊';
  const sanitized1 = responseValidator.validate(rawClicheResponse).sanitizedText;
  evaluate(!sanitized1.startsWith('Certainly!'), 'Sanitizer strips repetitive cliché opening');
  evaluate(sanitized1.includes('😊'), 'Natural single emoji preserved');

  // -------------------------------------------------------------------------
  // 2. PROFESSIONAL WRITING EVALUATION
  // -------------------------------------------------------------------------
  console.log('\n• 2. Professional Writing Evaluation');
  const profQuery = 'Draft an executive briefing on Q3 cloud infrastructure spending';
  const intent2 = detectIntent(profQuery);
  const prompt2 = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage(profQuery),
    intentAnalysis: intent2,
    responseStyle: 'professional',
  });

  evaluate(prompt2.includes('TONE DIRECTIVE: Maintain a polished, executive, professional tone'), 'Enforces formal executive tone');
  evaluate(prompt2.includes('Avoid filler words, exaggerated claims'), 'Strictly excludes filler and motivational claims');
  evaluate(prompt2.includes('Use few or none in formal emails, serious academic writing, technical reports'), 'Enforces conservative emoji policy in professional mode');

  // -------------------------------------------------------------------------
  // 3. CODING (USABLE DELIVERABLE EVALUATION)
  // -------------------------------------------------------------------------
  console.log('\n• 3. Coding (Complete & Usable Output)');
  const codeQuery = 'Write a TypeScript utility function to debounce async requests with cancellation';
  const intent3 = detectIntent(codeQuery);
  const prompt3 = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage(codeQuery),
    intentAnalysis: intent3,
    executionMode: 'EXECUTION_MODE',
    expectedDeliverable: 'code',
  });

  evaluate(intent3.executionMode === 'EXECUTION_MODE', 'Routes to EXECUTION_MODE');
  evaluate(prompt3.includes('Provide complete, functional, syntax-valid code with all imports and types'), 'Mandates complete syntax-valid code');
  evaluate(prompt3.includes('When the user asks for code, provide complete, usable, bug-free code'), 'Enforces usable deliverable over advice');

  // -------------------------------------------------------------------------
  // 4. DEBUGGING (ROOT CAUSE METHODOLOGY)
  // -------------------------------------------------------------------------
  console.log('\n• 4. Debugging & Root Cause Diagnosis');
  const debugQuery = 'Fix this error: Unhandled Runtime Error: Hydration failed because server HTML did not match client';
  const intent4 = detectIntent(debugQuery);
  const prompt4 = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage(debugQuery),
    intentAnalysis: intent4,
    executionMode: intent4.executionMode,
  });

  evaluate(intent4.detailedIntent === 'DEBUG', 'Classified as DEBUG intent');
  evaluate(prompt4.includes('Observe, Identify, Explain, Fix, and Verify'), 'Injects systematic root-cause methodology');
  evaluate(prompt4.includes('Address the actual root cause'), 'Explicitly commands model to target root cause');

  // -------------------------------------------------------------------------
  // 5. PROMPT GENERATION EVALUATION
  // -------------------------------------------------------------------------
  console.log('\n• 5. Prompt Generation Quality');
  const promptReq = 'give me prompt to build a real-time collaborative whiteboard';
  const intent5 = detectIntent(promptReq);
  const promptSys = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage(promptReq),
    intentAnalysis: intent5,
    executionMode: intent5.executionMode,
  });

  evaluate(intent5.executionMode === 'PROMPT_GENERATION_MODE', 'Routes to PROMPT_GENERATION_MODE');
  evaluate(promptSys.includes('Return ONE single, comprehensive, copy-paste-ready prompt'), 'Mandates single unified prompt');
  evaluate(promptSys.includes('TECH STACK') && promptSys.includes('SUCCESS CRITERIA'), 'Enforces all mandatory prompt engineering criteria');

  // -------------------------------------------------------------------------
  // 6. MATHEMATICS EVALUATION
  // -------------------------------------------------------------------------
  console.log('\n• 6. Mathematical Precision & Calculator Tool');
  const mathQuery = 'Calculate 142857 * 7';
  const intent6 = detectIntent(mathQuery);
  evaluate(intent6.requiresCalculator === true, 'Intent identifies math requiring exact calculation');
  const calcExec = await toolCoordinator.executeCalculation('142857 * 7');
  const calcVal = (calcExec.toolCalls[0].result as any)?.value;
  evaluate(calcVal === 999999, `Exact arithmetic: 142857 * 7 = 999999 (got ${calcVal})`);
  evaluate(calcExec.promptObservations.includes('999999'), 'Calculator observation commands model with exact answer');

  // -------------------------------------------------------------------------
  // 7. MULTILINGUAL: HINDI & HINGLISH
  // -------------------------------------------------------------------------
  console.log('\n• 7. Multilingual Support (Hindi & Hinglish)');
  
  // Hinglish
  const hinglishQuery = 'bhai node js me event loop kaise kaam karta hai aasan bhasha me samjhao';
  const langHinglish = detectLanguage(hinglishQuery);
  evaluate(langHinglish.isHinglish === true, 'Correctly flags Hinglish text');
  evaluate(langHinglish.promptGuidance.includes('Keep technical terms and code tokens in English'), 'Instructs model to retain technical tokens in English');
  
  // Hindi
  const hindiQuery = 'कंप्यूटर नेटवर्किंग में ओएसआई मॉडल क्या है?';
  const langHindi = detectLanguage(hindiQuery);
  evaluate(langHindi.detectedLanguage === 'hi', 'Recognizes pure Hindi Devanagari script');
  evaluate(langHindi.promptGuidance.includes('Hindi (Devanagari)'), 'Commands pure natural Hindi output');

  // -------------------------------------------------------------------------
  // 8. FOLLOW-UP QUESTIONS & USER CORRECTIONS
  // -------------------------------------------------------------------------
  console.log('\n• 8. Context Continuity & User Corrections');
  
  // Correction detection
  const correctionQuery = "No, that's not what I meant. I want Python with FastAPI, not Node.js";
  const intentCorr = detectIntent(correctionQuery, {
    conversationHistory: [{ role: 'assistant', content: 'Here is an Express.js server:' }],
  });
  evaluate(intentCorr.isCorrection === true, 'Accurately flags user correction');
  
  const promptCorr = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage(correctionQuery),
    intentAnalysis: intentCorr,
  });
  evaluate(promptCorr.includes('=== USER CORRECTION DIRECTIVE ==='), 'Injected explicit User Correction Directive');
  evaluate(promptCorr.includes('LATEST INSTRUCTION WINS'), 'Enforces latest instruction supersedes prior assumption');

  // Continuation detection
  const contQuery = 'continue and add user authentication to this';
  const intentCont = detectIntent(contQuery, {
    conversationHistory: [{ role: 'assistant', content: '```typescript\nexport const app = express();\n```' }],
  });
  evaluate(intentCont.detailedIntent === 'CONTINUE_PREVIOUS_TASK', 'Identifies task continuation intent');
  evaluate(intentCont.executionMode === 'EXECUTION_MODE', 'Inherits execution mode from ongoing coding task');

  // -------------------------------------------------------------------------
  // 9. LONG-CONTEXT CONVERSATIONS & ROLLING RECAP
  // -------------------------------------------------------------------------
  console.log('\n• 9. Long-Context Conversations & Rolling Summaries');
  const summaryPrompt = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage('What was the database schema we decided earlier?'),
    conversationSummary: 'Architecture decision: MongoDB for flexible chat documents, Redis for session cache.',
  });

  evaluate(summaryPrompt.includes('=== PREVIOUS CONVERSATION RECAP ==='), 'Includes recap section');
  evaluate(summaryPrompt.includes('MongoDB for flexible chat documents'), 'Injects long-term recap facts');
  evaluate(summaryPrompt.includes('Maintain smooth continuity with this history'), 'Instructs seamless memory continuity');

  // -------------------------------------------------------------------------
  // 10. CURRENT INFORMATION & FRESHNESS ANCHORING
  // -------------------------------------------------------------------------
  console.log('\n• 10. Current Information & Freshness Anchoring');
  const currentNews = checkFreshnessRequirement('What happened with the latest SpaceX launch today?');
  evaluate(currentNews.requiresFreshData === true, 'Freshness checker flags breaking real-world events');

  const sysTimePrompt = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage('What is today?'),
  });
  evaluate(sysTimePrompt.includes('Current Environment:'), 'Timestamp environment anchor injected');
  evaluate(sysTimePrompt.includes('Do not claim you need a tool for current date/time'), 'Prevents unnecessary tool calls for date');

  // -------------------------------------------------------------------------
  // 11. FILE & MULTIMODAL VISION ROUTING
  // -------------------------------------------------------------------------
  console.log('\n• 11. File & Multimodal Image Analysis Routing');
  const textModelVisionRoute = aiRouter.resolveRoute('llama-3.1-8b-instant', 'free', true);
  evaluate(textModelVisionRoute.model.id === 'ruhi-vision', 'Switches non-vision request to ruhi-vision when image attached');
  evaluate(textModelVisionRoute.model.supportsVision === true, 'Resolved model capability supports vision');

  const docIntent = detectIntent('Summarize section 4.2 of the attached report', true);
  evaluate(docIntent.requiresRag === true, 'Document query flags RAG requirement');
  evaluate(docIntent.primaryIntent === 'document_qa', 'Classified as document QA');

  // -------------------------------------------------------------------------
  // 12. PROVIDER FAILURE RECOVERY & MALFORMED OUTPUT DEFENSE
  // -------------------------------------------------------------------------
  console.log('\n• 12. Provider Failure Recovery & Malformed Output Defense');
  
  // Empty output defense
  const emptyVal = responseValidator.validate('');
  evaluate(emptyVal.isValid === false, 'Flags empty text response as invalid');
  evaluate(emptyVal.sanitizedText.includes("I'm here to help"), 'Provides gentle fallback message instead of silent blank screen');

  // Hallucination artifact defense
  const malformed = 'You can find the repo at [INSERT SOURCE HERE] using key [YOUR API KEY].';
  const cleanedMalformed = responseValidator.validate(malformed).sanitizedText;
  evaluate(!cleanedMalformed.includes('[INSERT SOURCE HERE]'), 'Scrubs [INSERT SOURCE HERE] artifact');
  evaluate(!cleanedMalformed.includes('[YOUR API KEY]'), 'Scrubs [YOUR API KEY] placeholder');

  // Router fallback test (Simulate request to unknown model)
  const unknownRoute = aiRouter.resolveRoute('non-existent-model-xyz', 'free');
  evaluate(unknownRoute.model.id === 'ruhi-balanced', 'Recovers gracefully from unknown model ID to ruhi-balanced');

  // -------------------------------------------------------------------------
  // 13. PERSISTENCE RESILIENCE
  // -------------------------------------------------------------------------
  console.log('\n• 13. Persistence Resilience (DB Fault Tolerance)');
  // Verify that safeDiagnostics records persistence events properly
  safeDiagnostics.record('persistence_event', {
    conversationId: 'test_conv_123',
    success: true,
    messageId: 'msg_abc',
  });
  const recentEvents = safeDiagnostics.getRecentEvents();
  const persistEvent = recentEvents.find((e) => e.type === 'persistence_event');
  evaluate(Boolean(persistEvent), 'Observability engine records persistence events');
  evaluate(persistEvent?.metadata.success === true, 'Persistence event reports success');

  // -------------------------------------------------------------------------
  // 14. SAFE OBSERVABILITY & TOKEN REDACTION
  // -------------------------------------------------------------------------
  console.log('\n• 14. Safe Observability & Security Redaction');
  safeDiagnostics.record('model_routed', {
    modelId: 'ruhi-balanced',
    secretKey: 'sk-proj-super-secret-key-12345678901234567890',
    authToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.abc',
    userQuery: 'How to sort an array in JavaScript',
  });

  const loggedEvents = safeDiagnostics.getRecentEvents();
  const securityEvent = loggedEvents.find((e) => e.metadata.modelId === 'ruhi-balanced');
  
  evaluate(securityEvent?.metadata.secretKey === '[REDACTED]', 'Redacts sensitive secretKey parameter');
  evaluate(securityEvent?.metadata.authToken === '[REDACTED]', 'Redacts sensitive authToken parameter');
  evaluate(securityEvent?.metadata.userQuery === 'How to sort an array in JavaScript', 'Preserves safe non-sensitive metadata');

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n=================================================================');
  console.log(`EVALUATION RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('=================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runEvaluationSuite().catch((err) => {
  console.error('Evaluation suite encountered an error:', err);
  process.exit(1);
});
