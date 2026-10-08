import {
  AIProvider,
  GenerateTextOptions,
  TextGenerationResult,
  StreamChunk,
} from './interface';
import { ModelCapability } from '@/types';
import { env } from '@/config/env';

export class GroqProvider implements AIProvider {
  readonly id = 'groq';
  readonly name = 'Groq';

  isConfigured(): boolean {
    return Boolean(env.GROQ_API_KEY && env.GROQ_API_KEY.trim().length > 5);
  }

  getAvailableModels(): ModelCapability[] {
    const configured = this.isConfigured();
    return [
      {
        id: 'llama-3.1-8b-instant',
        provider: 'groq',
        displayName: 'Llama 3.1 8B (Groq)',
        tagline: 'Ultra-fast inference for rapid reasoning and conversational tasks',
        contextWindow: 128000,
        supportsVision: false,
        supportsTools: true,
        supportsImageGen: false,
        isPremiumOnly: false,
        isAvailable: configured,
        speed: 'ultra-fast',
      },
      {
        id: 'llama-3.1-70b-versatile',
        provider: 'groq',
        displayName: 'Llama 3.1 70B (Groq)',
        tagline: 'High-quality open-source model running at blazing speeds',
        contextWindow: 128000,
        supportsVision: false,
        supportsTools: true,
        supportsImageGen: false,
        isPremiumOnly: true,
        isAvailable: configured,
        speed: 'fast',
      },
      {
        id: 'mixtral-8x7b-32768',
        provider: 'groq',
        displayName: 'Mixtral 8x7B (Groq)',
        tagline: 'Mixture of experts model optimized for high throughput',
        contextWindow: 32768,
        supportsVision: false,
        supportsTools: true,
        supportsImageGen: false,
        isPremiumOnly: false,
        isAvailable: configured,
        speed: 'fast',
      }
    ];
  }

  async generateText(options: GenerateTextOptions): Promise<TextGenerationResult> {
    if (!this.isConfigured()) {
      throw new Error('Groq Provider is not configured. Please add GROQ_API_KEY to your environment.');
    }

    // Map system prompt if present
    const messages = [];
    if (options.systemInstruction) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }
    messages.push(...options.messages.map((m) => ({ role: m.role, content: m.content })));

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.modelId || 'llama-3.1-8b-instant',
        messages: messages,
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API error (${res.status}): ${err}`);
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
      throw new Error('Groq Provider is not configured. Please add GROQ_API_KEY to your environment.');
    }

    const messages = [];
    if (options.systemInstruction) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }
    messages.push(...options.messages.map((m) => ({ role: m.role, content: m.content })));

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.modelId || 'llama-3.1-8b-instant',
        messages: messages,
        temperature: options.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Groq stream request failed with status ${res.status}`);
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
    throw new Error('Embeddings are currently not supported natively by the Groq Provider implementation.');
  }

  async analyzeImage(imageBase64: string, mimeType: string, prompt: string): Promise<string> {
    throw new Error('Vision capabilities are currently not supported natively by the Groq Provider implementation.');
  }
}
