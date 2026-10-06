import { ModelCapability } from '@/types';

export interface ProviderChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  images?: Array<{
    base64: string;
    mimeType: string;
  }>;
  toolCallId?: string;
  name?: string;
}

export interface ProviderToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      items?: Record<string, unknown>;
    }>;
    required?: string[];
  };
}

export interface GenerateTextOptions {
  modelId: string;
  messages: ProviderChatMessage[];
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: ProviderToolDefinition[];
}

export interface TextGenerationResult {
  text: string;
  toolCalls?: Array<{
    toolName: string;
    args: Record<string, unknown>;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  text: string;
  isComplete: boolean;
  toolCalls?: Array<{
    toolName: string;
    args: Record<string, unknown>;
  }>;
  error?: string;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  
  isConfigured(): boolean;
  getAvailableModels(): ModelCapability[];
  
  generateText(options: GenerateTextOptions): Promise<TextGenerationResult>;
  streamText(options: GenerateTextOptions): AsyncGenerator<StreamChunk, void, unknown>;
  generateEmbedding(text: string): Promise<number[]>;
  analyzeImage(imageBase64: string, mimeType: string, prompt: string): Promise<string>;
}
