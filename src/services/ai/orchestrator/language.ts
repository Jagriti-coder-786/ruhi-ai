export type DetectedLanguage =
  | 'en'
  | 'hi'
  | 'hinglish'
  | 'ur'
  | 'bn'
  | 'ta'
  | 'te'
  | 'mr'
  | 'gu'
  | 'pa'
  | 'ml'
  | 'kn'
  | 'od'
  | 'unknown';

export interface LanguageAnalysis {
  detectedLanguage: DetectedLanguage;
  requestedLanguage?: string;
  isHinglish: boolean;
  confidence: number;
  promptGuidance: string;
}

const HINGLISH_PATTERNS = [
  /\b(bhai|yaar|kya|hai|hain|kaise|karo|kare|karu|samjha|samjhao|mujhe|mera|meri|mere|isko|usko|ye|yeh|wo|woh|nahi|nahin|kyun|kyu|kaun|kab|kahan|thoda|accha|acha|theek|sahi|matlab|batao|batayein|chal|chahiye|hoga|hogi|raha|rahi|rahe|hota|hoti|hote)\b/i,
  /\b(simple language me|easy words mein|hindi me|hinglish me|samajh nahi aa raha|ye code kyun nahi chal raha)\b/i,
];

const EXPLICIT_REQUEST_PATTERNS = [
  { regex: /\b(in hindi|hindi me|hindi mein|हिंदी में)\b/i, lang: 'hi', name: 'Hindi' },
  { regex: /\b(in hinglish|hinglish me|hinglish mein)\b/i, lang: 'hinglish', name: 'Hinglish' },
  { regex: /\b(in bengali|bangla te|বাংলায়)\b/i, lang: 'bn', name: 'Bengali' },
  { regex: /\b(in tamil|tamilil|தமிழில்)\b/i, lang: 'ta', name: 'Tamil' },
  { regex: /\b(in telugu|telugulo|తెలుగులో)\b/i, lang: 'te', name: 'Telugu' },
  { regex: /\b(in urdu|urdu me|اردو میں)\b/i, lang: 'ur', name: 'Urdu' },
  { regex: /\b(in marathi|marathit|मराठीत)\b/i, lang: 'mr', name: 'Marathi' },
  { regex: /\b(in gujarati|gujaratima|ગુજરાતીમાં)\b/i, lang: 'gu', name: 'Gujarati' },
  { regex: /\b(in punjabi|punjabi vich|ਪੰਜਾਬੀ ਵਿੱਚ)\b/i, lang: 'pa', name: 'Punjabi' },
  { regex: /\b(in english|angrezi me)\b/i, lang: 'en', name: 'English' },
];

export function detectLanguage(text: string): LanguageAnalysis {
  const clean = text.trim();

  // 1. Check explicit language request
  for (const { regex, lang, name } of EXPLICIT_REQUEST_PATTERNS) {
    if (regex.test(clean)) {
      return {
        detectedLanguage: lang as DetectedLanguage,
        requestedLanguage: name,
        isHinglish: lang === 'hinglish',
        confidence: 0.95,
        promptGuidance: `CRITICAL LANGUAGE DIRECTIVE: The user explicitly requested their answer in ${name}. Respond fluently, naturally, and completely in ${name}.`,
      };
    }
  }

  // 2. Check Indic scripts
  if (/[\u0900-\u097F]/.test(clean)) {
    return {
      detectedLanguage: 'hi',
      isHinglish: false,
      confidence: 0.9,
      promptGuidance: `CRITICAL LANGUAGE DIRECTIVE: The user is writing in Hindi (Devanagari). Respond naturally, warmly, and fluently in pure, natural Hindi. Keep technical terminology clear.`,
    };
  }
  if (/[\u0980-\u09FF]/.test(clean)) {
    return {
      detectedLanguage: 'bn',
      isHinglish: false,
      confidence: 0.9,
      promptGuidance: `CRITICAL LANGUAGE DIRECTIVE: The user is writing in Bengali. Respond naturally and fluently in Bengali.`,
    };
  }
  if (/[\u0B80-\u0BFF]/.test(clean)) {
    return {
      detectedLanguage: 'ta',
      isHinglish: false,
      confidence: 0.9,
      promptGuidance: `CRITICAL LANGUAGE DIRECTIVE: The user is writing in Tamil. Respond naturally and fluently in Tamil.`,
    };
  }
  if (/[\u0C00-\u0C7F]/.test(clean)) {
    return {
      detectedLanguage: 'te',
      isHinglish: false,
      confidence: 0.9,
      promptGuidance: `CRITICAL LANGUAGE DIRECTIVE: The user is writing in Telugu. Respond naturally and fluently in Telugu.`,
    };
  }
  if (/[\u0600-\u06FF]/.test(clean)) {
    return {
      detectedLanguage: 'ur',
      isHinglish: false,
      confidence: 0.9,
      promptGuidance: `CRITICAL LANGUAGE DIRECTIVE: The user is writing in Urdu. Respond naturally, politely, and fluently in Urdu.`,
    };
  }

  // 3. Check Hinglish (Romanized Hindi)
  const isHinglishMatch = HINGLISH_PATTERNS.some((p) => p.test(clean));
  if (isHinglishMatch) {
    return {
      detectedLanguage: 'hinglish',
      isHinglish: true,
      confidence: 0.9,
      promptGuidance: `CRITICAL LANGUAGE DIRECTIVE:
The user is speaking in Hinglish (Hindi written in Latin script / mixed conversational Hindi-English, e.g. "bhai mujhe recursion simple language me samjha").
You MUST respond naturally in fluent, conversational Hinglish:
- Use natural conversational Hinglish words ("Haan bhai", "Dekho", "Aasan shabdon mein...", "Basically ye hota hai ki...").
- Keep technical terms and code tokens in English (e.g. "function", "recursion", "base case", "memory stack").
- Do NOT mechanically translate into formal pure Hindi (Devanagari) unless requested.
- Do NOT reply in stiff, generic formal English. Match the user's friendly, conversational tone and dialect.`,
    };
  }

  // 4. Default to English
  return {
    detectedLanguage: 'en',
    isHinglish: false,
    confidence: 0.85,
    promptGuidance: `Respond in clear, natural, and direct English.`,
  };
}
