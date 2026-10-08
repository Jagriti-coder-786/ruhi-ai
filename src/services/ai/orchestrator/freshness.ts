import { getCurrentDateTime } from '@/lib/time/currentDateTime';

export interface FreshnessCheckResult {
  requiresFreshData: boolean;
  reason?: string;
  generatedQueries: string[];
  suggestedTopic?: string;
  temporalAnchor: string;
}

const getAnchor = () => getCurrentDateTime().temporalAnchor;
export const TEMPORAL_ANCHOR = getAnchor();

const FRESHNESS_INDICATORS: Array<{
  pattern: RegExp;
  reason: string;
  queryTransform?: (match: RegExpMatchArray, text: string) => string[];
}> = [
  {
    pattern: /\blatest\s+gemini\s+(?:model|release|update|version|api)\b/i,
    reason: 'Gemini model release updates fluctuate frequently',
    queryTransform: () => [
      `Google Gemini latest model release ${getAnchor()}`,
      `Google DeepMind Gemini release notes ${getAnchor()}`,
    ],
  },
  {
    pattern: /\bwhat\s+happened\s+in\s+ai\s+today\b/i,
    reason: 'Real-time AI news inquiry',
    queryTransform: () => [
      `AI artificial intelligence news today ${getAnchor()}`,
      `top AI announcements ${getAnchor()}`,
    ],
  },
  {
    pattern: /\b(?:latest|today'?s|breaking|recent)\s+news\b/i,
    reason: 'Live news retrieval requested',
    queryTransform: (_m, text) => {
      const topic = text.replace(/(?:latest|today'?s|breaking|recent)\s+news/i, '').trim();
      return topic
        ? [`${topic} latest news ${getAnchor()}`, `${topic} news today`]
        : [`latest global news today ${getAnchor()}`, `top breaking news ${getAnchor()}`];
    },
  },
  {
    pattern: /\b(?:current|latest|today'?s?)\s+(?:price|rate|value)\s+of\s+([a-zA-Z0-9\s]+)\b/i,
    reason: 'Real-time price or financial rate inquiry',
    queryTransform: (match) => [
      `${match[1].trim()} price today ${getAnchor()}`,
      `${match[1].trim()} current market price`,
    ],
  },
  {
    pattern: /\bwho\s+won\s+(?:today|the match|yesterday|the game)\b/i,
    reason: 'Live sports match result inquiry',
    queryTransform: (_m, text) => [
      `${text.trim()} score result ${getAnchor()}`,
      `match winner today ${getAnchor()}`,
    ],
  },
  {
    pattern: /\bweather\s+(?:today|now|forecast)\s*(?:in\s+([a-zA-Z\s]+))?\b/i,
    reason: 'Current weather condition requested',
    queryTransform: (match) => {
      const loc = match[1]?.trim() || 'current location';
      return [`weather today in ${loc}`, `${loc} weather forecast`];
    },
  },
  {
    pattern: /\blatest\s+version\s+of\s+([a-zA-Z0-9.\-_]+)\b/i,
    reason: 'Software or library version release inquiry',
    queryTransform: (match) => [
      `${match[1].trim()} latest stable version release ${getAnchor()}`,
      `${match[1].trim()} release notes changelog`,
    ],
  },
  {
    pattern: /\b(abhi|latest|aaj)\s+(?:kya\s+naya|update|chal\s+raha)\b/i,
    reason: 'Hinglish inquiry for recent updates or breaking events',
    queryTransform: (_m, text) => [
      `${text.replace(/(abhi|kya|naya|chal|raha)/gi, '').trim()} latest updates ${getAnchor()}`,
    ],
  },
  {
    pattern: /\bwho\s+is\s+(?:the\s+)?current\s+(?:president|prime minister|ceo|leader)\s+of\s+([a-zA-Z\s]+)\b/i,
    reason: 'Current leadership office holder inquiry',
    queryTransform: (match) => [
      `current president prime minister leader of ${match[1].trim()} ${getAnchor()}`,
    ],
  },
];

export function checkFreshnessRequirement(userQuery: string): FreshnessCheckResult {
  const text = userQuery.trim();

  // If asking purely about current time/date, do NOT require web search
  if (/^(what is|what's)?\s*(today|today'?s date|date|current time|time|what day is it|day|tomorrow|yesterday)\??$/i.test(text)) {
    return {
      requiresFreshData: false,
      generatedQueries: [],
      temporalAnchor: getAnchor(),
    };
  }

  for (const item of FRESHNESS_INDICATORS) {
    const match = text.match(item.pattern);
    if (match) {
      const queries = item.queryTransform
        ? item.queryTransform(match, text)
        : [`${text} ${getAnchor()}`];

      return {
        requiresFreshData: true,
        reason: item.reason,
        generatedQueries: queries,
        temporalAnchor: getAnchor(),
      };
    }
  }

  // Broad check for words like "latest", "current", "today", "yesterday", "this week"
  const generalFreshnessWords = /\b(latest|current|recently|this week|aaj kya|naya kya)\b/i;
  // Make sure not to trigger just on "today" or "yesterday" if it's a simple query
  if (generalFreshnessWords.test(text) && !/\b(date|time|day|remember|forget|calculate|explain|hi|hello)\b/i.test(text)) {
    return {
      requiresFreshData: true,
      reason: 'Contains temporal or recency markers',
      generatedQueries: [`${text} ${getAnchor()}`, text],
      temporalAnchor: getAnchor(),
    };
  }

  return {
    requiresFreshData: false,
    generatedQueries: [],
    temporalAnchor: getAnchor(),
  };
}
