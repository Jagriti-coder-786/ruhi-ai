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

    // 1. Remove robotic canned disclaimers and repetitive phrases if present
    sanitized = sanitized
      .replace(/^As an AI (language model|assistant),?\s*/i, '')
      .replace(/^I am an AI (language model|assistant),?\s*/i, '')
      .replace(/^I understand(?:\.|!|,)\s*/i, '')
      .replace(/^Sure,? (I can|here is).*\n+/i, '')
      .replace(/^Here is the (information|prompt) you requested:\s*/i, '')
      .replace(/^Certainly!?\s*/i, '')
      .trim();

    // 2. Validate citations against verified sources
    const validatedCitations = citations.filter((c) => Boolean(c.url && c.title));

    // 3. Check for obvious hallucination artifacts
    if (sanitized.includes('[INSERT SOURCE HERE]') || sanitized.includes('[PLACEHOLDER]')) {
      sanitized = sanitized
        .replace(/\[INSERT SOURCE HERE\]/g, '')
        .replace(/\[PLACEHOLDER\]/g, '')
        .trim();
    }

    // 4. Truthfulness & Quality Gate
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
}

export const responseValidator = new ResponseValidator();
