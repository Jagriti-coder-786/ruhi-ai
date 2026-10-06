import {
  AIProvider,
  GenerateTextOptions,
  TextGenerationResult,
  StreamChunk,
} from './interface';
import { ModelCapability } from '@/types';
import { env } from '@/config/env';

export class OpenAIProvider implements AIProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';

  isConfigured(): boolean {
    return Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 5);
  }

  getAvailableModels(): ModelCapability[] {
    const configured = this.isConfigured();
    return [
      {
        id: 'gpt-4o',
        provider: 'openai',
        displayName: 'GPT-4o (Omni)',
        tagline: 'High-intelligence flagship model with multimodal vision and reasoning',
        contextWindow: 128000,
        supportsVision: true,
        supportsTools: true,
        supportsImageGen: true,
        isPremiumOnly: true,
        isAvailable: configured,
        speed: 'balanced',
      },
      {
        id: 'gpt-4o-mini',
        provider: 'openai',
        displayName: 'GPT-4o Mini',
        tagline: 'Fast, lightweight intelligence for daily tasks and conversational flow',
        contextWindow: 128000,
        supportsVision: true,
        supportsTools: true,
        supportsImageGen: false,
        isPremiumOnly: false,
        isAvailable: configured,
        speed: 'ultra-fast',
      },
    ];
  }

  async generateText(options: GenerateTextOptions): Promise<TextGenerationResult> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI Provider is not configured. Please add OPENAI_API_KEY to your environment.');
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.modelId || 'gpt-4o-mini',
        messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return {
      text: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }

  async *streamText(options: GenerateTextOptions): AsyncGenerator<StreamChunk, void, unknown> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI Provider is not configured. Please add OPENAI_API_KEY to your environment.');
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.modelId || 'gpt-4o-mini',
        messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`OpenAI stream request failed with status ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.slice(6);
        if (jsonStr === '[DONE]') {
          yield { text: '', isComplete: true };
          return;
        }
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            yield { text: delta, isComplete: false };
          }
        } catch {
          // ignore stream parse errors
        }
      }
    }

    yield { text: '', isComplete: true };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI Provider is not configured.');
    }

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
      }),
    });

    const data = await res.json();
    return data.data[0].embedding;
  }

  async analyzeImage(imageBase64: string, mimeType: string, prompt: string): Promise<string> {
    const result = await this.generateText({
      modelId: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
          images: [{ base64: imageBase64, mimeType }],
        },
      ],
    });
    return result.text;
  }
}
