import {
  AIProvider,
  GenerateTextOptions,
  TextGenerationResult,
  StreamChunk,
} from './interface';
import { ModelCapability } from '@/types';
import { env } from '@/config/env';

export class GrokProvider implements AIProvider {
  readonly id = 'grok';
  readonly name = 'xAI Grok';

  isConfigured(): boolean {
    return Boolean(env.XAI_API_KEY && env.XAI_API_KEY.trim().length > 5);
  }

  getAvailableModels(): ModelCapability[] {
    const configured = this.isConfigured();
    return [
      {
        id: 'grok-2',
        provider: 'grok',
        displayName: 'Grok 2 (xAI)',
        tagline: 'Direct, witty, and real-time knowledge synthesis',
        contextWindow: 131072,
        supportsVision: true,
        supportsTools: true,
        supportsImageGen: false,
        isPremiumOnly: true,
        isAvailable: configured,
        speed: 'balanced',
      },
    ];
  }

  async generateText(options: GenerateTextOptions): Promise<TextGenerationResult> {
    if (!this.isConfigured()) {
      throw new Error('xAI Grok Provider is not configured.');
    }

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.modelId || 'grok-2',
        messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (!res.ok) {
      throw new Error(`Grok error: ${await res.text()}`);
    }

    const data = await res.json();
    return {
      text: data.choices[0]?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  async *streamText(options: GenerateTextOptions): AsyncGenerator<StreamChunk, void, unknown> {
    const res = await this.generateText(options);
    yield { text: res.text, isComplete: true };
  }

  async generateEmbedding(_text: string): Promise<number[]> {
    throw new Error('Embedding not supported on Grok');
  }

  async analyzeImage(_imageBase64: string, _mimeType: string, prompt: string): Promise<string> {
    const res = await this.generateText({
      modelId: 'grok-2',
      messages: [{ role: 'user', content: prompt }],
    });
    return res.text;
  }
}
