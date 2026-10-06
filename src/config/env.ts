export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ruhi_ai',
  JWT_SECRET: process.env.JWT_SECRET || 'ruhi_ai_super_secret_jwt_key_2026_replace_in_production',
  
  // Primary AI Provider
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  
  // Optional Additional AI Providers
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  XAI_API_KEY: process.env.XAI_API_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  
  // Razorpay Payments
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  
  // Web Search Providers
  TAVILY_API_KEY: process.env.TAVILY_API_KEY || '',
};

export function validateCoreEnv() {
  const warnings: string[] = [];
  if (!env.GEMINI_API_KEY) {
    warnings.push('GEMINI_API_KEY is not set. Real AI calls will fall back to intelligent simulated assistant mode until configured in .env.local.');
  }
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    warnings.push('RAZORPAY keys are not configured. Subscriptions will run in Sandbox Simulation Mode.');
  }
  return warnings;
}
