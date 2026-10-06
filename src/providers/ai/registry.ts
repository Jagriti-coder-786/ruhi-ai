import { AIProvider } from './interface';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GrokProvider } from './grok';
import { OpenRouterProvider } from './openrouter';
import { ModelCapability, SubscriptionTier } from '@/types';

class ModelRegistry {
  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new AnthropicProvider());
    this.registerProvider(new GrokProvider());
    this.registerProvider(new OpenRouterProvider());
  }

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(providerId: string): AIProvider | undefined {
    return this.providers.get(providerId);
  }

  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Returns all available models across all configured providers.
   * If a provider is not configured with an API key, models can still be listed if Gemini is available,
   * or marked with availability flag for UI transparency.
   */
  getAllModels(): ModelCapability[] {
    const models: ModelCapability[] = [];
    for (const provider of this.providers.values()) {
      models.push(...provider.getAvailableModels());
    }
    return models;
  }

  /**
   * Returns models accessible by a specific user subscription tier
   */
  getModelsForTier(tier: SubscriptionTier): ModelCapability[] {
    const all = this.getAllModels();
    if (tier === 'pro' || tier === 'team') {
      return all;
    }
    // Free tier gets non-premium models
    return all.filter((m) => !m.isPremiumOnly);
  }

  getModelById(modelId: string): ModelCapability | undefined {
    return this.getAllModels().find((m) => m.id === modelId);
  }

  getProviderForModel(modelId: string): AIProvider | undefined {
    const model = this.getModelById(modelId);
    if (!model) {
      // Default to Gemini if unknown
      return this.providers.get('gemini');
    }
    return this.providers.get(model.provider);
  }
}

export const modelRegistry = new ModelRegistry();
export default modelRegistry;
