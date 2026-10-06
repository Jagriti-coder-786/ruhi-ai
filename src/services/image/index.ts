export interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  model?: 'flux' | 'turbo' | 'standard';
  negativePrompt?: string;
  seed?: number;
}

export interface GeneratedImageResult {
  imageUrl: string;
  revisedPrompt?: string;
  provider: string;
}

export class ImageGenerationService {
  /**
   * Generates a high quality AI image from text description
   */
  async generateImage(options: ImageGenerationOptions): Promise<GeneratedImageResult> {
    const { prompt, width = 1024, height = 1024, model = 'flux' } = options;
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      throw new Error('A descriptive prompt is required to generate an image.');
    }

    const encodedPrompt = encodeURIComponent(cleanPrompt);
    const seed = options.seed || Math.floor(Math.random() * 1000000);
    
    // Using high fidelity neural generation endpoint with FLUX/SDXL models
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true`;

    return {
      imageUrl,
      revisedPrompt: cleanPrompt,
      provider: 'Ruhi Neural Studio (Flux/Pollinations)',
    };
  }
}

export const imageGenerationService = new ImageGenerationService();
export default imageGenerationService;
