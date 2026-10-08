import {
  AIProvider,
  GenerateTextOptions,
  TextGenerationResult,
  StreamChunk,
} from './interface';
import { ModelCapability } from '@/types';
import { env } from '@/config/env';

export class AnthropicProvider implements AIProvider {
  readonly id = 'anthropic';
  readonly name = 'Anthropic Claude';

  isConfigured(): boolean {
    return Boolean(env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.trim().length > 5);
  }

  getAvailableModels(): ModelCapability[] {
    const configured = this.isConfigured();
    return [
      {
        id: 'claude-3-5-sonnet',
        provider: 'anthropic',
        displayName: 'Claude 3.5 Sonnet',
        tagline: 'Exceptional coding, nuanced writing, and visual reasoning',
        contextWindow: 200000,
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
      throw new Error('Anthropic Provider is not configured. Please add ANTHROPIC_API_KEY to your environment.');
    }

    const messages = options.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options.modelId || 'claude-3-5-sonnet-20241022',
        messages,
        system: options.systemInstruction,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    return {
      text,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    };
  }

  async *streamText(options: GenerateTextOptions): AsyncGenerator<StreamChunk, void, unknown> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic Provider is not configured. Please add ANTHROPIC_API_KEY to your environment.');
    }

    const messages = options.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options.modelId || 'claude-3-5-sonnet-20241022',
        messages,
        system: options.systemInstruction,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      const err = await res.text();
      throw new Error(`Anthropic stream request failed with status ${res.status}: ${err}`);
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
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            yield { text: parsed.delta.text, isComplete: false };
          } else if (parsed.type === 'message_stop') {
            yield { text: '', isComplete: true };
            return;
          }
        } catch {
          // ignore parsing errors
        }
      }
    }

    yield { text: '', isComplete: true };
  }

  async generateEmbedding(_text: string): Promise<number[]> {
    throw new Error('Anthropic does not natively expose embeddings; fallback to Gemini or local embedding.');
  }

  async analyzeImage(imageBase64: string, mimeType: string, prompt: string): Promise<string> {
    const res = await this.generateText({
      modelId: 'claude-3-5-sonnet',
      messages: [{ role: 'user', content: `${prompt}\n[Image: ${mimeType}]` }],
    });
    return res.text;
  }
}
