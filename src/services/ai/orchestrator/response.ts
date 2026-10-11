import { ICitation } from '@/types';
import { ExecutionMode, ExpectedDeliverable } from './intent';

export interface ValidationContext {
  executionMode?: ExecutionMode;
  expectedDeliverable?: ExpectedDeliverable;
  missingRequiredFiles?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedText: string;
  warning?: string;
  validatedCitations: ICitation[];
}

export class ResponseValidator {
  /**
   * Validate and sanitize assistant text before emitting
   */
  validate(
    text: string,
    citations: ICitation[] = [],
    context?: ValidationContext
  ): ValidationResult {
    let sanitized = (text || '').trim();

    if (!sanitized) {
      return {
        isValid: false,
        sanitizedText: "I'm here to help, but I didn't generate a response for that prompt. Could you please rephrase or try again?",
        warning: 'Empty response received from provider.',
        validatedCitations: [],
      };
    }

    // 1. Remove robotic canned disclaimers, cliché openings, and repetitive meta-talk
    sanitized = sanitized
      .replace(/^(?:As an AI (?:language model|assistant|system)|I am an AI (?:language model|assistant)|I'm an AI (?:language model|assistant)|As an artificial intelligence)[\s,:.-]*/i, '')
      .replace(/^(?:Certainly!?|Absolutely!?|Great question!?|Good question!?|I completely understand(?:\.|!|,)?|Sure thing!?|Of course!?)\s*/i, '')
      .replace(/^I understand(?:\.|!|,)\s*/i, '')
      .replace(/^Sure,? (?:I can|here is).*\n+/i, '')
      .replace(/^(?:Here is the|Below is the) (?:information|prompt|code|answer|solution|response)(?: you requested)?[:.]?\s*\n*/i, '')
      .replace(/^Regarding your (?:question|query) (?:about|regarding) .*?:?\s*\n*/i, '')
      .replace(/^You asked: .*?\n+/i, '')
      .trim();

    // 2. Intelligent Emoji Usage & Formatting Filter
    // Collapse repeated emojis (e.g. 😊😊😊 -> 😊) while strictly preserving code blocks
    sanitized = this.moderateEmojis(sanitized);

    // 3. Validate citations against verified sources
    const validatedCitations = citations.filter((c) => Boolean(c.url && c.title));

    // 4. Check for obvious hallucination artifacts and placeholders
    if (
      sanitized.includes('[INSERT SOURCE HERE]') ||
      sanitized.includes('[PLACEHOLDER]') ||
      sanitized.includes('[INSERT URL HERE]') ||
      sanitized.includes('[YOUR API KEY]')
    ) {
      sanitized = sanitized
        .replace(/\[INSERT SOURCE HERE\]/g, '')
        .replace(/\[PLACEHOLDER\]/g, '')
        .replace(/\[INSERT URL HERE\]/g, '')
        .replace(/\[YOUR API KEY\]/g, '')
        .trim();
    }

    // 5. Truthfulness & Quality Gate
    // If user asked to modify an existing project without files, but the model falsely said "I have updated your code in your project"
    if (context?.missingRequiredFiles) {
      if (/\b(?:I have updated your (?:files|codebase|repository)|I have committed the changes|done!)\b/i.test(sanitized)) {
        sanitized = `Sure. Send or upload your existing portfolio or project files and I will work directly on your code without removing anything.\n\n${sanitized}`;
      }
    }

    return {
      isValid: true,
      sanitizedText: sanitized,
      validatedCitations,
    };
  }

  /**
   * Intelligently moderate emojis to prevent spammy repetition while preserving code blocks
   */
  private moderateEmojis(text: string): string {
    if (!text) return text;
    // Split text into code blocks and normal prose to never modify code or markdown structures
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts
      .map((part) => {
        if (part.startsWith('```')) return part;
        // Collapse identical consecutive emojis: e.g. 😊😊😊 -> 😊
        return part.replace(/(\p{Extended_Pictographic})\s*\1+/gu, '$1');
      })
      .join('');
  }
}

export const responseValidator = new ResponseValidator();
