import mongoose from 'mongoose';
import connectDB from './src/lib/db/mongoose';
import { aiOrchestrator } from './src/services/ai/orchestrator';
import { detectIntent } from './src/services/ai/orchestrator/intent';

async function runLiveTests() {
  await connectDB();
  console.log('\n======================================================');
  console.log('🤖 RUHI AI: DIRECT PIPELINE LIVE EXECUTION TESTS');
  console.log('======================================================\n');

  // Test 1: Ambiguity Check
  console.log('1. Testing: "can you give me prompt" (No Context)');
  const res1 = await aiOrchestrator.process({
    userId: new mongoose.Types.ObjectId().toString(),
    userPlan: 'pro',
    content: 'can you give me prompt',
  });
  let out1 = '';
  for await (const chunk of res1.stream) {
    if (chunk.text) out1 += chunk.text;
  }
  console.log(`Ruhi Result: "${out1}"`);

  // Test 2: Date Check
  console.log('\n2. Testing: "what\'s today\'s date?"');
  const res2 = await aiOrchestrator.process({
    userId: new mongoose.Types.ObjectId().toString(),
    userPlan: 'pro',
    content: "what's today's date?",
  });
  let out2 = '';
  for await (const chunk of res2.stream) {
    if (chunk.text) out2 += chunk.text;
  }
  console.log(`Ruhi Result: "${out2.trim()}"`);

  // Test 3: Action Execution Check
  console.log('\n3. Testing: "build my portfolio professionally"');
  const intent3 = detectIntent('build my portfolio professionally');
  console.log(`Classified: Mode=${intent3.executionMode}, DetailedIntent=${intent3.detailedIntent}, Deliverable=${intent3.expectedDeliverable}`);

  // Test 4: Missing Files Check
  console.log('\n4. Testing: "make this website better" (No files attached)');
  const res4 = await aiOrchestrator.process({
    userId: new mongoose.Types.ObjectId().toString(),
    userPlan: 'pro',
    content: 'make this website better',
  });
  let out4 = '';
  for await (const chunk of res4.stream) {
    if (chunk.text) out4 += chunk.text;
  }
  console.log(`Ruhi Result: "${out4.trim()}"`);

  console.log('\n======================================================');
  console.log('✅ DIRECT PIPELINE TESTS COMPLETED');
  console.log('======================================================\n');
  process.exit(0);
}

runLiveTests().catch((e) => {
  console.error('Error in live test:', e);
  process.exit(1);
});
