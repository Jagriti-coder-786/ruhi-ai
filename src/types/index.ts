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
    responseStyle?: 'balanced' | 'concise' | 'detailed' | 'professional' | 'creative';
    responseLength?: 'short' | 'standard' | 'detailed';
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

export interface IMessageVersion {
  content: string;
  model?: string;
  citations?: ICitation[];
  toolCalls?: IToolCall[];
  createdAt: string;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  userId: string;
  role: MessageRole;
  content: string;
  modelId?: string;
  versions?: IMessageVersion[];
  activeVersionIndex?: number;
  parentMessageId?: string;
  branchId?: string;
  attachments?: IAttachment[];
  toolCalls?: IToolCall[];
  citations?: ICitation[];
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  feedback?: 'like' | 'dislike';
  feedbackReason?: string;
  feedbackComment?: string;
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
  isTemporary?: boolean;
  expiresAt?: string;
  shareToken?: string;
  isShared?: boolean;
  metadata?: {
    lastMessagePreview?: string;
    totalMessages?: number;
    summary?: string;
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
  provider: 'gemini' | 'openai' | 'anthropic' | 'grok' | 'openrouter' | 'custom' | 'groq';
  displayName: string;
  tagline: string;
  contextWindow: number;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsImageGen: boolean;
  isPremiumOnly: boolean;
  isAvailable: boolean;
  speed: 'ultra-fast' | 'fast' | 'balanced' | 'deep-reasoning';
}

export interface IArtifact {
  _id: string;
  userId: string;
  conversationId?: string;
  projectId?: string;
  title: string;
  type: 'document' | 'code' | 'spreadsheet' | 'presentation';
  content: string;
  language?: string;
  metadata?: Record<string, unknown>;
  versions?: Array<{
    content: string;
    title?: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface IConnector {
  _id: string;
  userId: string;
  provider: 'google_drive' | 'github' | 'slack' | 'notion' | 'dropbox';
  name: string;
  status: 'connected' | 'disconnected';
  accountEmail?: string;
  scopes: string[];
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IScheduledTask {
  _id: string;
  userId: string;
  title: string;
  prompt: string;
  scheduleType: 'once' | 'daily' | 'weekly' | 'monthly';
  scheduledTime?: string;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  notifyVia: 'in_app' | 'email';
  createdAt: string;
  updatedAt: string;
}

export interface IDeepResearchPlan {
  goal: string;
  steps: Array<{
    id: string;
    query: string;
    status: 'pending' | 'in_progress' | 'completed';
    findings?: string;
  }>;
  summaryReport?: string;
}

export interface IDataAnalysisResult {
  columns: string[];
  rowCount: number;
  summaryStats: Record<string, { count: number; mean?: number; min?: number; max?: number; unique?: number }>;
  chartData?: {
    type: 'bar' | 'line' | 'pie';
    title: string;
    labels: string[];
    data: number[];
  };
  insights: string[];
}

