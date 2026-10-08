/**
 * 🌸 Smart Conversation Title Generator
 * Generates human-friendly 3-5 word titles without robotic or generic prefixes
 */

export function generateSmartTitle(userPrompt: string): string {
  const clean = userPrompt.trim();
  if (!clean) return 'New Conversation';

  // 1. Math / Calculations
  if (/^calculate[:\s]+|^what is \d+|[\d\s+\-*/%^xX×÷]{4,}/i.test(clean)) {
    const mathMatch = clean.match(/[\d\s+\-*/%^xX×÷]{3,}/);
    return mathMatch ? `Math: ${mathMatch[0].trim()}` : 'Mathematical Calculation';
  }

  // 2. Hinglish tech inquiries
  if (/bhai|samjha|kya hai|kaise/i.test(clean)) {
    if (/recursion/i.test(clean)) return 'Recursion in Simple Terms';
    if (/code/i.test(clean)) return 'Code Explanation & Debugging';
    if (/update|naya/i.test(clean)) return 'Latest Tech Updates';
  }

  // 3. News & Current Events
  if (/news|today|what happened/i.test(clean)) {
    if (/ai/i.test(clean)) return 'AI Developments & News';
    if (/tech/i.test(clean)) return 'Technology News Briefing';
    return 'Current News & Events';
  }

  // 4. Programming / Coding
  const codeTechs = clean.match(
    /\b(react|next\.?js|python|typescript|javascript|vue|angular|rust|docker|kubernetes|node|golang|java|css|tailwind)\b/i
  );
  if (codeTechs) {
    const tech = codeTechs[0].charAt(0).toUpperCase() + codeTechs[0].slice(1);
    if (/debug|error|bug|fix|issue|chal nahi/i.test(clean)) return `${tech} Debugging & Fix`;
    if (/explain|how|what/i.test(clean)) return `${tech} Overview & Guide`;
    return `${tech} Development`;
  }

  // 5. Clean first sentence / question
  let title = clean
    .replace(/^(hi|hello|hey|namaste|ruhi|can you|please|tell me|explain to me|explain|what is|how to)\s+/i, '')
    .replace(/[?!.]+$/, '')
    .trim();

  if (title.length > 36) {
    title = title.slice(0, 36).replace(/\s+\S*$/, '');
  }

  // Capitalize first letter
  return title.charAt(0).toUpperCase() + title.slice(1) || 'New Conversation';
}
