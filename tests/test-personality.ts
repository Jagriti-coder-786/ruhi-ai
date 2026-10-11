/**
 * 🌸 RUHI AI - Comprehensive Personality Specification Verification Suite
 * Verifies all 11 Sections + Golden Rule of the Natural, Intelligent & Professional Personality
 * 
 * Test Categories:
 * 1. Casual Conversations & Cliché Defense
 * 2. Technical Questions & Adaptive Tone
 * 3. Coding Requests (Deliverable & Usable Code)
 * 4. Debugging (Root Cause Thinking: Observe, Identify, Explain, Fix)
 * 5. Prompt Generation Mode
 * 6. Professional Writing (Polished, Executive, Zero Filler)
 * 7. Multilingual Support (English, Hindi & Natural Hinglish)
 * 8. Follow-up Questions & Context Continuity
 * 9. Current Information & Freshness Anchoring
 * 10. Complex Requests & Deliverables
 * 11. Intelligent Emoji Moderation & Response Validator Quality Gate
 * 12. Full Multi-Provider System Instruction Uniformity
 * 
 * Run with: npx tsx tests/test-personality.ts
 */

import { contextManager } from '../src/services/ai/orchestrator/context';
import { responseValidator } from '../src/services/ai/orchestrator/response';
import { detectLanguage } from '../src/services/ai/orchestrator/language';
import { detectIntent } from '../src/services/ai/orchestrator/intent';
import { checkFreshnessRequirement } from '../src/services/ai/orchestrator/freshness';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runPersonalityTests() {
  console.log('\n🌸 =================================================================');
  console.log('🌸 RUHI AI: PERSONALITY & RESPONSE INTELLIGENCE TEST SUITE');
  console.log('🌸 =================================================================\n');

  // -------------------------------------------------------------------------
  // 1. CASUAL CONVERSATIONS & CLICHÉ DEFENSE
  // -------------------------------------------------------------------------
  console.log('• Category 1: Casual Conversations & Cliché Opening Defense');
  const casualPrompt = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage('Hey Ruhi, how are you doing today?'),
    intentAnalysis: detectIntent('Hey Ruhi, how are you doing today?'),
  });

  assert(
    casualPrompt.includes('Casual conversation: warm, relaxed, approachable, and friendly'),
    'Includes adaptive casual tone directive'
  );
  assert(
    casualPrompt.includes('AVOID repetitive openings such as "Absolutely!", "Great question!", "Certainly!"'),
    'Commands model to avoid cliché conversational openings'
  );

  // Response filter defense against clichés
  const rawWithCliche1 = 'Great question! Recursion is when a function calls itself.';
  const rawWithCliche2 = 'Certainly! Here is how to configure Tailwind.';
  const rawWithCliche3 = 'Absolutely! Let me explain that.';
  const rawWithCliche4 = 'I completely understand. We should configure the caching layer first.';
  
  assert(
    responseValidator.validate(rawWithCliche1).sanitizedText.startsWith('Recursion is when a function calls itself'),
    'Strips "Great question!" opener cleanly'
  );
  assert(
    responseValidator.validate(rawWithCliche2).sanitizedText.startsWith('Here is how to configure Tailwind'),
    'Strips "Certainly!" opener cleanly'
  );
  assert(
    responseValidator.validate(rawWithCliche3).sanitizedText.startsWith('Let me explain that'),
    'Strips "Absolutely!" opener cleanly'
  );
  assert(
    responseValidator.validate(rawWithCliche4).sanitizedText.startsWith('We should configure the caching layer first'),
    'Strips "I completely understand." opener cleanly'
  );

  // -------------------------------------------------------------------------
  // 2. TECHNICAL QUESTIONS & ADAPTIVE TONE
  // -------------------------------------------------------------------------
  console.log('\n• Category 2: Technical Questions & Adaptive Tone');
  const techPrompt = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage('Explain how the V8 JavaScript call stack handles asynchronous events'),
    intentAnalysis: detectIntent('Explain how the V8 JavaScript call stack handles asynchronous events'),
  });

  assert(
    techPrompt.includes('Technical help: clear, competent, practical, and rigorous'),
    'System prompt enforces technical tone for engineering questions'
  );
  assert(
    techPrompt.includes('Use code blocks for code and copy-ready technical instructions'),
    'Mandates code blocks and copy-ready technical formatting'
  );

  // -------------------------------------------------------------------------
  // 3. CODING (USABLE CODE BLOCKS & DELIVERABLE FIRST)
  // -------------------------------------------------------------------------
  console.log('\n• Category 3: Coding Requests (Deliverable & Usable Code)');
  const codeIntent = detectIntent('Write a Next.js 15 API route that handles JWT authentication');
  const codePrompt = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage('Write a Next.js 15 API route that handles JWT authentication'),
    intentAnalysis: codeIntent,
    executionMode: codeIntent.executionMode,
    expectedDeliverable: codeIntent.expectedDeliverable,
  });

  assert(codeIntent.executionMode === 'EXECUTION_MODE', 'Classified as EXECUTION_MODE');
  assert(
    codePrompt.includes('Provide complete, functional, syntax-valid code with all imports and types'),
    'Requires complete runnable code without placeholders'
  );
  assert(
    codePrompt.includes('When the user asks for code, provide complete, usable, bug-free code'),
    'Enforces usable bug-free code delivery'
  );

  // -------------------------------------------------------------------------
  // 4. DEBUGGING & ROOT CAUSE THINKING
  // -------------------------------------------------------------------------
  console.log('\n• Category 4: Debugging (Root Cause Thinking: Observe, Identify, Explain, Fix)');
  const debugIntent = detectIntent('Fix this bug: TypeError: Cannot read properties of undefined (reading "map")');
  const debugPrompt = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage('Fix this bug: TypeError: Cannot read properties of undefined'),
    intentAnalysis: debugIntent,
    executionMode: debugIntent.executionMode,
  });

  assert(
    debugPrompt.includes('ROOT CAUSE THINKING: For problems and errors, do not suggest random guesses. Observe, Identify, Explain, Fix, and Verify'),
    'Inculcates root-cause diagnostic method'
  );
  assert(
    debugPrompt.includes('identify the likely root cause, and provide or implement the correction'),
    'Directs model to implement actual fix based on root cause'
  );

  // -------------------------------------------------------------------------
  // 5. PROMPT GENERATION MODE
  // -------------------------------------------------------------------------
  console.log('\n• Category 5: Prompt Generation Mode');
  const promptIntent = detectIntent('give me prompt to build an ecommerce store in Next.js');
  const promptSys = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage('give me prompt to build an ecommerce store in Next.js'),
    intentAnalysis: promptIntent,
    executionMode: promptIntent.executionMode,
  });

  assert(promptIntent.executionMode === 'PROMPT_GENERATION_MODE', 'Routes to PROMPT_GENERATION_MODE');
  assert(
    promptSys.includes('Return ONE single, comprehensive, copy-paste-ready prompt'),
    'System prompt mandates single comprehensive copy-ready prompt'
  );
  assert(
    promptSys.includes('When the user requests a prompt, provide a copy-ready prompt relevant to their goal'),
    'Personality directive reinforces prompt utility'
  );

  // -------------------------------------------------------------------------
  // 6. PROFESSIONAL WRITING (POLISHED, EXECUTIVE, ZERO FILLER)
  // -------------------------------------------------------------------------
  console.log('\n• Category 6: Professional Writing (Polished, Executive, Zero Filler)');
  const profPrompt = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage('Draft a formal project handover summary for our enterprise client'),
    responseStyle: 'professional',
  });

  assert(
    profPrompt.includes('TONE DIRECTIVE: Maintain a polished, executive, professional tone'),
    'Injects formal executive tone directive'
  );
  assert(
    profPrompt.includes('Avoid filler words, exaggerated claims, unnecessary motivational statements, and vague recommendations'),
    'Excludes motivational fluff and filler'
  );
  assert(
    profPrompt.includes('Use few or none in formal emails, serious academic writing, technical reports'),
    'Enforces zero or minimal emojis for professional outputs'
  );

  // -------------------------------------------------------------------------
  // 7. NATURAL MULTILINGUAL COMMUNICATION (ENGLISH, HINDI & HINGLISH)
  // -------------------------------------------------------------------------
  console.log('\n• Category 7: Natural Multilingual Communication');
  
  // Hinglish
  const hinglishAnalysis = detectLanguage('bhai ye async await wala error kaise solve kare simple shabdon me batao');
  assert(hinglishAnalysis.isHinglish === true, 'Accurately flags conversational Hinglish');
  assert(
    hinglishAnalysis.promptGuidance.includes('Keep technical terms and code tokens in English'),
    'Directs Hinglish output to keep programming terms in English'
  );
  assert(
    hinglishAnalysis.promptGuidance.includes('Do NOT mechanically translate into formal pure Hindi'),
    'Prevents awkward Sanskritized Hindi when user talks in casual Hinglish'
  );

  // Pure Hindi
  const hindiAnalysis = detectLanguage('मुझे मशीन लर्निंग के मूल सिद्धांत समझाइए');
  assert(hindiAnalysis.detectedLanguage === 'hi', 'Detects Devanagari Hindi');
  assert(
    hindiAnalysis.promptGuidance.includes('Hindi (Devanagari)'),
    'Guides response in natural, fluent Hindi'
  );

  // -------------------------------------------------------------------------
  // 8. FOLLOW-UP QUESTIONS & CONTEXT CONTINUITY
  // -------------------------------------------------------------------------
  console.log('\n• Category 8: Context Continuity & Follow-up Questions');
  const followUpPrompt = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage('Make it faster and optimize the queries'),
    conversationSummary: 'Previous discussion was about optimizing PostgreSQL database queries for user orders.',
  });

  assert(
    followUpPrompt.includes('Resolve references like "this", "that", "make it better", "continue", and "fix this"'),
    'Instructs model to resolve contextual pronouns'
  );
  assert(
    followUpPrompt.includes('=== PREVIOUS CONVERSATION RECAP ==='),
    'Recaps previous conversation summary'
  );
  assert(
    followUpPrompt.includes('Only ask ONE concise clarification question if a missing detail is genuinely blocking'),
    'Limits follow-up queries to at most one blocking question'
  );

  // -------------------------------------------------------------------------
  // 9. CURRENT INFORMATION & FRESHNESS ANCHORING
  // -------------------------------------------------------------------------
  console.log('\n• Category 9: Current Information & Freshness Anchoring');
  const newsFreshness = checkFreshnessRequirement('What are the latest AI models released this week?');
  assert(newsFreshness.requiresFreshData === true, 'Flags query requiring live fresh data');
  
  const currentPrompt = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage('What is today?'),
  });
  assert(
    currentPrompt.includes('Current Environment:'),
    'Includes current real-time timestamp anchor'
  );
  assert(
    currentPrompt.includes('Do not claim you need a tool for current date/time'),
    'Instructs assistant to know the current system date natively'
  );

  // -------------------------------------------------------------------------
  // 10. COMPLEX REQUESTS & DELIVERABLES
  // -------------------------------------------------------------------------
  console.log('\n• Category 10: Complex Requests & Deliverables');
  const complexPrompt = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage('Design the complete microservices architecture for Ruhi AI with high availability'),
    responseLength: 'detailed',
  });

  assert(
    complexPrompt.includes('Provide a comprehensive, deeply structured explanation with full depth and practical examples'),
    'Directs comprehensive multi-stage breakdown for complex architecture'
  );
  assert(
    complexPrompt.includes('When the user asks for a deliverable, produce the deliverable instead of merely explaining how to create it'),
    'Enforces output creation over mere lecture'
  );

  // -------------------------------------------------------------------------
  // 11. INTELLIGENT EMOJI MODERATION & QUALITY GATE
  // -------------------------------------------------------------------------
  console.log('\n• Category 11: Intelligent Emoji Moderation & Response Gate');
  
  // Moderate duplicated emojis
  const textWithEmojiSpam = 'Great progress! 😊😊😊 We did it 🎉🎉🎉 Check the code:\n```typescript\nconst emoji = "🚀🚀🚀";\n```';
  const valEmoji = responseValidator.validate(textWithEmojiSpam);
  
  assert(
    !valEmoji.sanitizedText.includes('😊😊😊'),
    'Collapses duplicate emojis in prose'
  );
  assert(
    valEmoji.sanitizedText.includes('😊') && valEmoji.sanitizedText.includes('🎉'),
    'Preserves single meaningful emoji'
  );
  assert(
    valEmoji.sanitizedText.includes('const emoji = "🚀🚀🚀";'),
    'Strictly preserves code blocks with original tokens intact'
  );

  // Anti-Hallucination & Honest Verification
  const textWithPlaceholder = 'Please check the docs at [INSERT SOURCE HERE] and use [YOUR API KEY].';
  const valPlaceholder = responseValidator.validate(textWithPlaceholder);
  assert(
    !valPlaceholder.sanitizedText.includes('[INSERT SOURCE HERE]') &&
    !valPlaceholder.sanitizedText.includes('[YOUR API KEY]'),
    'Cleans placeholder hallucination artifacts'
  );

  // -------------------------------------------------------------------------
  // 12. GOLDEN RULE INTEGRITY
  // -------------------------------------------------------------------------
  console.log('\n• Category 12: Golden Rule Adherence');
  const basePrompt = contextManager.buildSystemPrompt({
    languageAnalysis: detectLanguage('Hello'),
  });

  assert(
    basePrompt.includes('Be warm when warmth helps, professional when professionalism matters, detailed when depth is needed, and concise when simplicity is best'),
    'System prompt explicitly commands the Golden Rule'
  );
  assert(
    basePrompt.includes('The user should feel understood, respected, and helped — never overwhelmed by unnecessary words, emojis, or generic advice'),
    'Embeds core user empathy goal into prompt core'
  );

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n=================================================================');
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('=================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPersonalityTests().catch((err) => {
  console.error('Personality test suite failed:', err);
  process.exit(1);
});
