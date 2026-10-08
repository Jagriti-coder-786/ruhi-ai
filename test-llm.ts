import mongoose from 'mongoose';
import connectDB from './src/lib/db/mongoose';
import { aiRouter } from './src/providers/ai/router';
import { contextManager } from './src/services/ai/orchestrator/context';

async function test() {
  await connectDB();
  const systemInstruction = contextManager.buildSystemPrompt({
    languageAnalysis: { primaryLanguage: 'en', confidence: 1 },
    conversationSummary: '',
  });

  console.log("System Prompt:");
  console.log(systemInstruction);
  
  const res = await aiRouter.generateRoutedText({
    modelId: 'ruhi-balanced',
    systemInstruction,
    messages: [
      { role: 'user', content: 'can you give me prompt' }
    ]
  }, 'pro');

  console.log("\n\nResponse:");
  console.log(res.text);
  process.exit(0);
}

test().catch(console.error);
