import { contextManager } from './src/services/ai/orchestrator/context';

const prompt = contextManager.buildSystemPrompt({
  languageAnalysis: { primaryLanguage: 'en', confidence: 1, promptGuidance: 'Speak English' },
  conversationSummary: 'User asked about Ruhi architecture.',
  responseStyle: 'balanced',
});
console.log(prompt);
