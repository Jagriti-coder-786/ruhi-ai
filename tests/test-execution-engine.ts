/**
 * 🌸 RUHI AI - EXECUTION-FIRST INTELLIGENCE ENGINE VERIFICATION
 * Tests Section 26 Anti-Random-Answer Tests (Tests A through I)
 * Run with: npx tsx tests/test-execution-engine.ts
 */

import { detectIntent } from '../src/services/ai/orchestrator/intent';
import { contextManager } from '../src/services/ai/orchestrator/context';
import { responseValidator } from '../src/services/ai/orchestrator/response';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

async function runExecutionTests() {
  console.log('\n🌸 ========================================================');
  console.log('🌸 RUHI AI: EXECUTION-FIRST ENGINE SPECIFICATION TESTS');
  console.log('🌸 ========================================================\n');

  // ----------------------------------------------------
  // TEST A: "can you give me prompt" (With NO context)
  // ----------------------------------------------------
  console.log('• TEST A: Naked Prompt Request — "can you give me prompt" (No Context)');
  const testAIntent = detectIntent('can you give me prompt', { conversationHistory: [] });
  assert(testAIntent.detailedIntent === 'CLARIFY', 'Classified as CLARIFY intent', `Got: ${testAIntent.detailedIntent}`);
  assert(testAIntent.executionMode === 'CLARIFY_MODE', 'Execution mode set to CLARIFY_MODE', `Got: ${testAIntent.executionMode}`);
  assert(
    Boolean(testAIntent.clarificationMessage?.includes('What should the prompt be for')),
    'Returns concise clarifying question instead of random code review prompt',
    `Message: ${testAIntent.clarificationMessage}`
  );

  // ----------------------------------------------------
  // TEST B: Previous context "Improve my Ruhi AI", then "can you give me prompt"
  // ----------------------------------------------------
  console.log('\n• TEST B: Contextual Prompt Request — Context: "Improve my Ruhi AI" -> "can you give me prompt"');
  const testBIntent = detectIntent('can you give me prompt', {
    conversationHistory: [
      { role: 'user', content: 'Improve my Ruhi AI.' },
      { role: 'assistant', content: 'Understood, let us review Ruhi AI capabilities.' },
    ],
  });
  assert(testBIntent.detailedIntent === 'GENERATE_PROMPT', 'Classified as GENERATE_PROMPT intent', `Got: ${testBIntent.detailedIntent}`);
  assert(testBIntent.executionMode === 'PROMPT_GENERATION_MODE', 'Execution mode is PROMPT_GENERATION_MODE', `Got: ${testBIntent.executionMode}`);
  assert(testBIntent.contextTopic === 'Ruhi AI', 'Inferred context topic as Ruhi AI', `Got: ${testBIntent.contextTopic}`);
  
  const testBPrompt = contextManager.buildSystemPrompt({
    languageAnalysis: { detectedLanguage: 'en', confidence: 1, isHinglish: false, promptGuidance: '' },
    intentAnalysis: testBIntent,
    executionMode: testBIntent.executionMode,
  });
  assert(testBPrompt.includes('PROMPT GENERATION DIRECTIVE'), 'Injects high-fidelity prompt generation directive');
  assert(testBPrompt.includes('Ruhi AI'), 'Directs prompt to target Ruhi AI specifically');

  // ----------------------------------------------------
  // TEST C: "how can i build portfolio professionally"
  // ----------------------------------------------------
  console.log('\n• TEST C: Advice Request — "how can i build portfolio professionally"');
  const testCIntent = detectIntent('how can i build portfolio professionally');
  assert(testCIntent.executionMode === 'ADVICE_MODE', 'Classified as ADVICE_MODE (not raw execution)', `Got: ${testCIntent.executionMode}`);
  assert(testCIntent.detailedIntent === 'ADVISE', 'Detailed intent is ADVISE', `Got: ${testCIntent.detailedIntent}`);
  assert(testCIntent.expectedDeliverable === 'plan', 'Expected deliverable is plan/guidance', `Got: ${testCIntent.expectedDeliverable}`);

  // ----------------------------------------------------
  // TEST D: "build my portfolio professionally"
  // ----------------------------------------------------
  console.log('\n• TEST D: Execution Request — "build my portfolio professionally"');
  const testDIntent = detectIntent('build my portfolio professionally');
  assert(testDIntent.executionMode === 'EXECUTION_MODE', 'Classified as EXECUTION_MODE', `Got: ${testDIntent.executionMode}`);
  assert(testDIntent.detailedIntent === 'CREATE_WEBSITE', 'Detailed intent is CREATE_WEBSITE', `Got: ${testDIntent.detailedIntent}`);
  assert(testDIntent.expectedDeliverable === 'website', 'Expected deliverable is website', `Got: ${testDIntent.expectedDeliverable}`);

  // ----------------------------------------------------
  // TEST E: "give me prompt to build my portfolio"
  // ----------------------------------------------------
  console.log('\n• TEST E: Explicit Target Prompt — "give me prompt to build my portfolio"');
  const testEIntent = detectIntent('give me prompt to build my portfolio');
  assert(testEIntent.executionMode === 'PROMPT_GENERATION_MODE', 'Classified as PROMPT_GENERATION_MODE', `Got: ${testEIntent.executionMode}`);
  assert(testEIntent.detailedIntent === 'GENERATE_PROMPT', 'Detailed intent is GENERATE_PROMPT', `Got: ${testEIntent.detailedIntent}`);
  assert(Boolean(testEIntent.contextTopic?.includes('build my portfolio')), 'Identified portfolio target from query', `Got: ${testEIntent.contextTopic}`);

  // ----------------------------------------------------
  // TEST F: "make this website better" (with & without files)
  // ----------------------------------------------------
  console.log('\n• TEST F: Existing Project Modification — "make this website better"');
  // Without files:
  const testFNoFiles = detectIntent('make this website better', { hasAttachments: false, hasProject: false });
  assert(testFNoFiles.missingRequiredFiles === true, 'Flags missing required files');
  assert(
    Boolean(testFNoFiles.fileRequestMessage?.includes('Send/upload your existing portfolio or project files')),
    'Prompts directly for files without lecturing',
    `Message: ${testFNoFiles.fileRequestMessage}`
  );

  // With files:
  const testFWithFiles = detectIntent('make this website better', { hasAttachments: true, hasProject: false });
  assert(testFWithFiles.executionMode === 'EXECUTION_MODE', 'With files attached: EXECUTION_MODE active');
  assert(testFWithFiles.detailedIntent === 'EDIT', 'Detailed intent is EDIT');
  assert(testFWithFiles.missingRequiredFiles === false, 'No missing files when attachment present');

  // ----------------------------------------------------
  // TEST G: "write the code"
  // ----------------------------------------------------
  console.log('\n• TEST G: Direct Code Request — "write the code"');
  const testGIntent = detectIntent('write the code');
  assert(testGIntent.executionMode === 'EXECUTION_MODE', 'Classified as EXECUTION_MODE');
  assert(testGIntent.detailedIntent === 'CODE', 'Detailed intent is CODE');
  assert(testGIntent.expectedDeliverable === 'code', 'Expected deliverable is code');

  // ----------------------------------------------------
  // TEST H: "create the website"
  // ----------------------------------------------------
  console.log('\n• TEST H: Direct Website Request — "create the website"');
  const testHIntent = detectIntent('create the website');
  assert(testHIntent.executionMode === 'EXECUTION_MODE', 'Classified as EXECUTION_MODE');
  assert(testHIntent.detailedIntent === 'CREATE_WEBSITE', 'Detailed intent is CREATE_WEBSITE');
  assert(testHIntent.expectedDeliverable === 'website', 'Expected deliverable is website');

  // ----------------------------------------------------
  // TEST I: "fix this error"
  // ----------------------------------------------------
  console.log('\n• TEST I: Bug Fix Request — "fix this error"');
  const testIIntent = detectIntent('fix this error');
  assert(testIIntent.executionMode === 'EXECUTION_MODE', 'Classified as EXECUTION_MODE');
  assert(testIIntent.detailedIntent === 'DEBUG', 'Detailed intent is DEBUG');
  assert(testIIntent.expectedDeliverable === 'code', 'Expected deliverable is code');

  // ----------------------------------------------------
  // TEST J: Action Verb Detection
  // ----------------------------------------------------
  console.log('\n• TEST J: Action Verb Detection');
  const testJ1 = detectIntent('build me a modern landing page');
  assert(testJ1.actionVerbsDetected.includes('build'), 'Detects action verb "build"');
  
  const testJ2 = detectIntent('modify and debug this script');
  assert(testJ2.actionVerbsDetected.includes('modify'), 'Detects action verb "modify"');
  assert(testJ2.actionVerbsDetected.includes('debug'), 'Detects action verb "debug"');

  // ----------------------------------------------------
  // TEST K: Quality Gate & Validation Truthfulness
  // ----------------------------------------------------
  console.log('\n• TEST K: Quality Gate & Truthfulness');
  const fakeCompletedResponse = "Done! I have updated your files in your project repository.";
  const validated = responseValidator.validate(fakeCompletedResponse, [], { missingRequiredFiles: true });
  assert(
    validated.sanitizedText.includes('Send or upload your existing portfolio or project files'),
    'Prevents false completion claims when files were not attached'
  );

  console.log('\n========================================================');
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================\n');

  if (failed > 0) process.exit(1);
}

runExecutionTests().catch(console.error);
