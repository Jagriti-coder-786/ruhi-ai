export type UserRole = 'user' | 'admin';
export type SubscriptionTier = 'free' | 'pro' | 'team';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  plan: SubscriptionTier;
  avatar?: string;
  preferences?: {
    theme?: 'dark' | 'light' | 'system';
    defaultModel?: string;
    systemPrompt?: string;
    temperature?: number;
    streamResponses?: boolean;
    webSearchDefault?: boolean;
    voiceEnabled?: boolean;
    voiceName?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface IAttachment {
  name: string;
  type: string; // 'image' | 'pdf' | 'document' | 'code' | 'other'
  mimeType: string;
  size: number;
  url?: string;
  dataBase64?: string;
  extractedText?: string;
  documentId?: string;
}

export interface IToolCall {
  toolName: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown> | string;
  status: 'pending' | 'success' | 'failed';
}

export interface ICitation {
  title: string;
  url?: string;
  snippet: string;
  sourceType: 'web' | 'document';
  documentId?: string;
  page?: number;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  userId: string;
  role: MessageRole;
  content: string;
  modelId?: string;
  attachments?: IAttachment[];
  toolCalls?: IToolCall[];
  citations?: ICitation[];
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  feedback?: 'like' | 'dislike';
  createdAt: string;
  updatedAt: string;
}

export interface IConversation {
  _id: string;
  userId: string;
  title: string;
  modelId: string;
  projectId?: string;
  pinned: boolean;
  archived: boolean;
  metadata?: {
    lastMessagePreview?: string;
    totalMessages?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IDocument {
  _id: string;
  userId: string;
  projectId?: string;
  conversationId?: string;
  name: string;
  mimeType: string;
  size: number;
  chunksCount: number;
  summary?: string;
  status: 'processing' | 'ready' | 'error';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDocumentChunk {
  _id: string;
  documentId: string;
  userId: string;
  chunkIndex: number;
  content: string;
  embedding?: number[];
  metadata?: {
    pageNumber?: number;
    charCount?: number;
  };
  createdAt: string;
}

export interface IMemory {
  _id: string;
  userId: string;
  category: 'preference' | 'instruction' | 'fact' | 'project';
  content: string;
  isEnabled: boolean;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IProject {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  customInstructions?: string;
  documentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ISubscription {
  _id: string;
  userId: string;
  plan: SubscriptionTier;
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export interface IUsage {
  _id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  requestCount: number;
  tokensTotal: number;
  imagesGenerated: number;
  voiceSeconds: number;
  storageBytes: number;
}

export interface ModelCapability {
  id: string;
  provider: 'gemini' | 'openai' | 'anthropic' | 'grok' | 'openrouter' | 'custom';
  displayName: string;
  tagline: string;
  contextWindow: number;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsImageGen: boolean;
  isPremiumOnly: boolean;
  isAvailable: boolean;
  speed: 'ultra-fast' | 'balanced' | 'deep-reasoning';
}
