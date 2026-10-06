import modelRegistry from './registry';
import { AIProvider, GenerateTextOptions, StreamChunk, TextGenerationResult } from './interface';
import { SubscriptionTier, ModelCapability } from '@/types';

export interface RouteResolution {
  provider: AIProvider;
  model: ModelCapability;
  isFallback: boolean;
  notice?: string;
}

export class AIRouter {
  /**
   * Resolve provider and model based on user selection, subscription tier, and inputs
   */
  resolveRoute(
    requestedModelId: string,
    userTier: SubscriptionTier,
    hasImages: boolean = false
  ): RouteResolution {
    let targetModelId = requestedModelId || 'ruhi-balanced';
    let notice: string | undefined;

    // Check if requested model exists
    let model = modelRegistry.getModelById(targetModelId);
    if (!model) {
      targetModelId = 'ruhi-balanced';
      model = modelRegistry.getModelById(targetModelId)!;
    }

    // 1. Multimodal Vision Override if images are provided
    if (hasImages && !model.supportsVision) {
      targetModelId = 'ruhi-vision';
      model = modelRegistry.getModelById('ruhi-vision') || model;
      notice = 'Switched to Ruhi Multimodal Vision to process your uploaded images.';
    }

    // 2. Subscription Tier Authorization (Server-Side Protection)
    if (model.isPremiumOnly && userTier === 'free') {
      targetModelId = 'ruhi-balanced';
      model = modelRegistry.getModelById('ruhi-balanced')!;
      notice = `The model "${requestedModelId}" is reserved for Pro & Team members. Routed to Ruhi Balanced.`;
    }

    // 3. Resolve Provider
    let provider = modelRegistry.getProviderForModel(targetModelId);
    let isFallback = false;

    // If provider is not configured or not available, fallback to Gemini
    if (!provider || !provider.isConfigured()) {
      const geminiProvider = modelRegistry.getProvider('gemini');
      if (geminiProvider) {
        provider = geminiProvider;
        if (targetModelId !== 'ruhi-balanced' && targetModelId !== 'ruhi-fast' && targetModelId !== 'ruhi-reasoner') {
          isFallback = true;
          notice = `Provider for ${targetModelId} is not configured with an API key. Routed to Ruhi Intelligence.`;
        }
      }
    }

    return {
      provider: provider || modelRegistry.getProvider('gemini')!,
      model,
      isFallback,
      notice,
    };
  }

  /**
   * Route and stream with automatic fallback recovery
   */
  async *streamRoutedText(
    options: GenerateTextOptions,
    userTier: SubscriptionTier,
    hasImages: boolean = false
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const route = this.resolveRoute(options.modelId, userTier, hasImages);
    
    try {
      yield* route.provider.streamText({
        ...options,
        modelId: route.model.id,
      });
    } catch (err: any) {
      console.warn(`[AIRouter] Primary provider ${route.provider.id} error:`, err.message);
      
      // Fallback to Gemini if not already using it
      if (route.provider.id !== 'gemini') {
        const gemini = modelRegistry.getProvider('gemini');
        if (gemini) {
          yield {
            text: `\n\n*(Notice: Switching to Ruhi Gemini engine due to a provider response timeout...)*\n\n`,
            isComplete: false,
          };
          yield* gemini.streamText({
            ...options,
            modelId: 'ruhi-balanced',
          });
          return;
        }
      }

      yield {
        text: `\n\n*(Ruhi AI encountered an error: ${err.message})*`,
        isComplete: true,
        error: err.message,
      };
    }
  }

  /**
   * Generate text with fallback
   */
  async generateRoutedText(
    options: GenerateTextOptions,
    userTier: SubscriptionTier,
    hasImages: boolean = false
  ): Promise<TextGenerationResult> {
    const route = this.resolveRoute(options.modelId, userTier, hasImages);
    
    try {
      return await route.provider.generateText({
        ...options,
        modelId: route.model.id,
      });
    } catch (err: any) {
      if (route.provider.id !== 'gemini') {
        const gemini = modelRegistry.getProvider('gemini');
        if (gemini) {
          return await gemini.generateText({
            ...options,
            modelId: 'ruhi-balanced',
          });
        }
      }
      throw err;
    }
  }
}

export const aiRouter = new AIRouter();
export default aiRouter;
