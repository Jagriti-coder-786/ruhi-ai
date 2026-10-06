import {
  AIProvider,
  GenerateTextOptions,
  TextGenerationResult,
  StreamChunk,
} from './interface';
import { ModelCapability } from '@/types';
import { env } from '@/config/env';

export class OpenRouterProvider implements AIProvider {
  readonly id = 'openrouter';
  readonly name = 'OpenRouter';

  isConfigured(): boolean {
    return Boolean(env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim().length > 5);
  }

  getAvailableModels(): ModelCapability[] {
    const configured = this.isConfigured();
    return [
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        provider: 'openrouter',
        displayName: 'Llama 3.3 70B (Meta)',
        tagline: 'Leading open weights model with state of the art instruction adherence',
        contextWindow: 131072,
        supportsVision: false,
        supportsTools: true,
        supportsImageGen: false,
        isPremiumOnly: true,
        isAvailable: configured,
        speed: 'balanced',
      },
      {
        id: 'deepseek/deepseek-r1',
        provider: 'openrouter',
        displayName: 'DeepSeek R1',
        tagline: 'Next-generation open reasoning model with transparent chain-of-thought',
        contextWindow: 65536,
        supportsVision: false,
        supportsTools: false,
        supportsImageGen: false,
        isPremiumOnly: true,
        isAvailable: configured,
        speed: 'deep-reasoning',
      },
    ];
  }

  async generateText(options: GenerateTextOptions): Promise<TextGenerationResult> {
    if (!this.isConfigured()) {
      throw new Error('OpenRouter Provider is not configured.');
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': env.APP_URL,
        'X-Title': 'Ruhi AI',
      },
      body: JSON.stringify({
        model: options.modelId,
        messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter error: ${await res.text()}`);
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
    throw new Error('Embedding not implemented for OpenRouter');
  }

  async analyzeImage(_imageBase64: string, _mimeType: string, prompt: string): Promise<string> {
    const res = await this.generateText({
      modelId: 'meta-llama/llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: prompt }],
    });
    return res.text;
  }
}
