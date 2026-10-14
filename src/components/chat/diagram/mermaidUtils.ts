/**
 * Mermaid Detection, Parsing, and Utilities for Ruhi AI
 * Supports Mermaid 12.2.0 with safe streaming, theme awareness, and conservative code routing.
 */

export interface DiagramTypeInfo {
  type: string;
  label: string;
}

// Explicit programming and markup languages that should NEVER be routed to Mermaid
const EXPLICIT_CODE_LANGUAGES = new Set([
  'javascript', 'js', 'jsx', 'mjs', 'cjs',
  'typescript', 'ts', 'tsx',
  'python', 'py', 'pyw',
  'json', 'jsonc', 'json5',
  'html', 'htm', 'xhtml',
  'css', 'scss', 'sass', 'less',
  'bash', 'sh', 'shell', 'zsh', 'fish', 'cmd', 'bat', 'powershell', 'ps1',
  'sql', 'mysql', 'pgsql', 'postgres', 'sqlite',
  'yaml', 'yml',
  'markdown', 'md', 'mdx',
  'xml', 'svg',
  'dockerfile', 'docker',
  'rust', 'rs',
  'go', 'golang',
  'java', 'kotlin', 'kt', 'scala', 'groovy',
  'c', 'h', 'cpp', 'hpp', 'cc', 'cxx', 'csharp', 'cs',
  'php', 'ruby', 'rb', 'perl', 'pl',
  'swift', 'dart', 'r', 'lua',
  'diff', 'patch',
  'graphql', 'gql',
  'vue', 'svelte',
  'toml', 'ini', 'env',
  'plaintext', 'text', 'txt'
]);

// Map of diagram syntax patterns to human-readable labels
const DIAGRAM_TYPE_PATTERNS: Array<{ regex: RegExp; type: string; label: string }> = [
  { regex: /^\s*(flowchart|graph)\b/i, type: 'flowchart', label: 'Flowchart' },
  { regex: /^\s*sequenceDiagram\b/i, type: 'sequenceDiagram', label: 'Sequence Diagram' },
  { regex: /^\s*classDiagram(-v2)?\b/i, type: 'classDiagram', label: 'Class Diagram' },
  { regex: /^\s*stateDiagram(-v2)?\b/i, type: 'stateDiagram', label: 'State Diagram' },
  { regex: /^\s*erDiagram\b/i, type: 'erDiagram', label: 'Entity Relationship Diagram' },
  { regex: /^\s*gantt\b/i, type: 'gantt', label: 'Gantt Chart' },
  { regex: /^\s*pie\b/i, type: 'pie', label: 'Pie Chart' },
  { regex: /^\s*timeline\b/i, type: 'timeline', label: 'Timeline Diagram' },
  { regex: /^\s*gitGraph\b/i, type: 'gitGraph', label: 'Git Graph' },
  { regex: /^\s*mindmap\b/i, type: 'mindmap', label: 'Mindmap' },
  { regex: /^\s*quadrantChart\b/i, type: 'quadrantChart', label: 'Quadrant Chart' },
  { regex: /^\s*(c4Context|c4Container|c4Component|c4Dynamic|c4Deployment)\b/i, type: 'c4', label: 'C4 Architecture Diagram' },
  { regex: /^\s*architecture(-beta)?\b/i, type: 'architecture', label: 'Architecture Diagram' },
  { regex: /^\s*sankey-beta\b/i, type: 'sankey', label: 'Sankey Diagram' },
  { regex: /^\s*xychart-beta\b/i, type: 'xychart', label: 'XY Chart' },
  { regex: /^\s*block-beta\b/i, type: 'block', label: 'Block Diagram' },
  { regex: /^\s*packet-beta\b/i, type: 'packet', label: 'Packet Diagram' },
];

/**
 * Clean up raw diagram code: strips markdown backtick wrappers if model accidentally nested them
 */
export function cleanMermaidSource(code: string): string {
  if (!code) return '';
  let cleaned = code.trim();

  // Strip wrapping ```mermaid ... ``` or ``` ... ``` if present inside code block
  const wrappedMatch = /^```(?:mermaid)?\s*\n([\s\S]*?)\n```$/i.exec(cleaned);
  if (wrappedMatch) {
    cleaned = wrappedMatch[1].trim();
  }

  // Remove leading empty lines
  cleaned = cleaned.replace(/^\s*\n+/, '');

  return cleaned;
}

/**
 * Checks if the given language identifier explicitly points to Mermaid
 */
export function isMermaidLanguage(lang?: string): boolean {
  if (!lang) return false;
  const normalized = lang.trim().toLowerCase();
  return normalized === 'mermaid' || normalized === 'diagram';
}

/**
 * Checks if the given language identifier is a regular code language
 */
export function isExplicitCodeLanguage(lang?: string): boolean {
  if (!lang) return false;
  const normalized = lang.trim().toLowerCase();
  return EXPLICIT_CODE_LANGUAGES.has(normalized);
}

/**
 * Detects diagram type from Mermaid source code
 */
export function detectDiagramType(code: string): DiagramTypeInfo | null {
  const cleaned = cleanMermaidSource(code);
  if (!cleaned) return null;

  for (const pattern of DIAGRAM_TYPE_PATTERNS) {
    if (pattern.regex.test(cleaned)) {
      return { type: pattern.type, label: pattern.label };
    }
  }

  return null;
}

/**
 * Conservative routing check: determines if a fenced block should be handled as Mermaid
 */
export function isMermaidBlock(lang: string | undefined, code: string): boolean {
  const normalizedLang = (lang || '').trim().toLowerCase();

  // If language is explicitly a known code language (e.g. JS, Python, TS, JSON, Bash), NEVER treat as Mermaid
  if (isExplicitCodeLanguage(normalizedLang)) {
    return false;
  }

  // If language is explicitly 'mermaid' or 'diagram'
  if (isMermaidLanguage(normalizedLang)) {
    return true;
  }

  // If no language or ambiguous 'text'/'code', only treat as Mermaid if the source starts with a known diagram header
  if (!normalizedLang || normalizedLang === 'text' || normalizedLang === 'code') {
    return detectDiagramType(code) !== null;
  }

  return false;
}

async function ensureMermaidEnvironment() {
  if (typeof window === 'undefined') {
    try {
      const dompurifyModule = await import('dompurify');
      const DOMPurify: any = dompurifyModule.default || dompurifyModule;
      if (typeof DOMPurify === 'function') {
        if (!DOMPurify.addHook) DOMPurify.addHook = () => {};
        if (!DOMPurify.sanitize) DOMPurify.sanitize = (str: string) => str;
        if (!DOMPurify.removeAllHooks) DOMPurify.removeAllHooks = () => {};
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Validates Mermaid syntax using the installed Mermaid parser
 */
export async function validateMermaidSyntax(code: string): Promise<{ valid: boolean; error?: string; diagramType?: string }> {
  const cleaned = cleanMermaidSource(code);
  if (!cleaned) {
    return { valid: false, error: 'Empty diagram code' };
  }

  try {
    await ensureMermaidEnvironment();
    const mermaidModule = await import('mermaid');
    const mermaid = mermaidModule.default || mermaidModule;

    // Suppress error dumping into DOM during validation
    if (typeof mermaid.setParseErrorHandler === 'function') {
      mermaid.setParseErrorHandler(() => {});
    }

    const parseResult = await mermaid.parse(cleaned);
    const diagramType = typeof parseResult === 'object' && parseResult && 'diagramType' in parseResult
      ? String((parseResult as any).diagramType)
      : undefined;

    return { valid: true, diagramType };
  } catch (err: any) {
    return {
      valid: false,
      error: err?.message || 'Invalid diagram syntax'
    };
  }
}

/**
 * Generates Ruhi AI Emerald theme configuration for Mermaid
 */
export function getMermaidThemeConfig(theme: 'dark' | 'light') {
  const isDark = theme === 'dark';

  return {
    startOnLoad: false,
    suppressErrorRendering: true,
    securityLevel: 'strict' as const,
    theme: (isDark ? 'dark' : 'base') as any,
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    themeVariables: isDark
      ? {
          darkMode: true,
          background: '#090d16',
          primaryColor: '#064e3b',
          primaryTextColor: '#f8fafc',
          primaryBorderColor: '#10b981',
          lineColor: '#34d399',
          secondaryColor: '#0f172a',
          secondaryTextColor: '#f8fafc',
          secondaryBorderColor: '#059669',
          tertiaryColor: '#1e293b',
          tertiaryTextColor: '#e2e8f0',
          tertiaryBorderColor: '#334155',
          mainBkg: '#0f172a',
          nodeBorder: '#10b981',
          nodeTextColor: '#f8fafc',
          clusterBkg: '#090d16',
          clusterBorder: '#334155',
          titleColor: '#34d399',
          edgeLabelBackground: '#0b1120',
          actorBorder: '#10b981',
          actorBkg: '#0f172a',
          actorTextColor: '#f8fafc',
          actorLineColor: '#34d399',
          signalColor: '#34d399',
          signalTextColor: '#f8fafc',
          labelBoxBkgColor: '#0f172a',
          labelBoxBorderColor: '#10b981',
          labelTextColor: '#f8fafc',
          loopTextColor: '#f8fafc',
          noteBorderColor: '#10b981',
          noteBkgColor: '#064e3b',
          noteTextColor: '#ecfdf5',
          git0: '#10b981',
          git1: '#06b6d4',
          git2: '#8b5cf6',
          git3: '#f59e0b',
        }
      : {
          darkMode: false,
          background: '#ffffff',
          primaryColor: '#ecfdf5',
          primaryTextColor: '#064e3b',
          primaryBorderColor: '#059669',
          lineColor: '#059669',
          secondaryColor: '#f0fdf4',
          secondaryTextColor: '#065f46',
          secondaryBorderColor: '#10b981',
          tertiaryColor: '#f8fafc',
          tertiaryTextColor: '#0f172a',
          tertiaryBorderColor: '#cbd5e1',
          mainBkg: '#ffffff',
          nodeBorder: '#059669',
          nodeTextColor: '#064e3b',
          clusterBkg: '#f8fafc',
          clusterBorder: '#cbd5e1',
          titleColor: '#065f46',
          edgeLabelBackground: '#ffffff',
          actorBorder: '#059669',
          actorBkg: '#f0fdf4',
          actorTextColor: '#0f172a',
          actorLineColor: '#059669',
          signalColor: '#059669',
          signalTextColor: '#0f172a',
          labelBoxBkgColor: '#ffffff',
          labelBoxBorderColor: '#059669',
          labelTextColor: '#0f172a',
          loopTextColor: '#0f172a',
          noteBorderColor: '#059669',
          noteBkgColor: '#f0fdf4',
          noteTextColor: '#065f46',
          git0: '#059669',
          git1: '#0891b2',
          git2: '#7c3aed',
          git3: '#d97706',
        },
  };
}
