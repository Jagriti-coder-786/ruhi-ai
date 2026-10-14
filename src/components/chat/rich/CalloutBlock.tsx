'use client';

import React from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Lightbulb,
  Quote,
} from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

export type CalloutType = 'note' | 'success' | 'warning' | 'critical' | 'insight' | 'quote';

interface CalloutConfig {
  type: CalloutType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  borderDark: string;
  bgDark: string;
  textDark: string;
  iconDark: string;
  borderLight: string;
  bgLight: string;
  textLight: string;
  iconLight: string;
}

const CALLOUT_CONFIGS: Record<CalloutType, CalloutConfig> = {
  note: {
    type: 'note',
    label: 'Note',
    icon: Info,
    borderDark: 'border-blue-500/50',
    bgDark: 'bg-blue-500/10',
    textDark: 'text-blue-200',
    iconDark: 'text-blue-400',
    borderLight: 'border-blue-400',
    bgLight: 'bg-blue-50/80',
    textLight: 'text-blue-950',
    iconLight: 'text-blue-600',
  },
  success: {
    type: 'success',
    label: 'Success',
    icon: CheckCircle2,
    borderDark: 'border-emerald-500/50',
    bgDark: 'bg-emerald-500/10',
    textDark: 'text-emerald-200',
    iconDark: 'text-emerald-400',
    borderLight: 'border-emerald-400',
    bgLight: 'bg-emerald-50/80',
    textLight: 'text-emerald-950',
    iconLight: 'text-emerald-600',
  },
  warning: {
    type: 'warning',
    label: 'Warning',
    icon: AlertTriangle,
    borderDark: 'border-amber-500/50',
    bgDark: 'bg-amber-500/10',
    textDark: 'text-amber-200',
    iconDark: 'text-amber-400',
    borderLight: 'border-amber-400',
    bgLight: 'bg-amber-50/80',
    textLight: 'text-amber-950',
    iconLight: 'text-amber-600',
  },
  critical: {
    type: 'critical',
    label: 'Critical',
    icon: AlertOctagon,
    borderDark: 'border-rose-500/50',
    bgDark: 'bg-rose-500/10',
    textDark: 'text-rose-200',
    iconDark: 'text-rose-400',
    borderLight: 'border-rose-400',
    bgLight: 'bg-rose-50/80',
    textLight: 'text-rose-950',
    iconLight: 'text-rose-600',
  },
  insight: {
    type: 'insight',
    label: 'Insight',
    icon: Lightbulb,
    borderDark: 'border-purple-500/50',
    bgDark: 'bg-purple-500/10',
    textDark: 'text-purple-200',
    iconDark: 'text-purple-400',
    borderLight: 'border-purple-400',
    bgLight: 'bg-purple-50/80',
    textLight: 'text-purple-950',
    iconLight: 'text-purple-600',
  },
  quote: {
    type: 'quote',
    label: '',
    icon: Quote,
    borderDark: 'border-emerald-500/70',
    bgDark: 'bg-emerald-500/5',
    textDark: 'text-slate-300',
    iconDark: 'text-emerald-400',
    borderLight: 'border-emerald-500',
    bgLight: 'bg-emerald-50/50',
    textLight: 'text-slate-700',
    iconLight: 'text-emerald-600',
  },
};

/**
 * Extracts callout metadata from raw blockquote string or React children
 */
export function parseCalloutContent(rawText: string): {
  type: CalloutType;
  title: string;
  cleanedText: string;
  isCallout: boolean;
} {
  const trimmed = (rawText || '').trim();

  // Pattern 1: GitHub / Markdown Alert syntax, e.g. [!NOTE], [!WARNING], [!TIP], [!CAUTION], [!IMPORTANT]
  const alertMatch = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|ERROR|CRITICAL|SUCCESS|INSIGHT)\]\s*(.*)$/im.exec(trimmed);
  if (alertMatch) {
    const rawTag = alertMatch[1].toUpperCase();
    const customTitle = alertMatch[2]?.trim();
    let type: CalloutType = 'note';

    if (rawTag === 'SUCCESS') type = 'success';
    else if (rawTag === 'WARNING') type = 'warning';
    else if (rawTag === 'CAUTION' || rawTag === 'ERROR' || rawTag === 'CRITICAL') type = 'critical';
    else if (rawTag === 'TIP' || rawTag === 'INSIGHT' || rawTag === 'IMPORTANT') type = 'insight';

    const restOfText = trimmed.replace(alertMatch[0], '').trim();
    return {
      type,
      title: customTitle || CALLOUT_CONFIGS[type].label,
      cleanedText: restOfText,
      isCallout: true,
    };
  }

  // Pattern 2: Emoji or textual prefix, e.g. "💡 Insight:", "⚠️ Warning:", "Note:", "✅ Success:"
  // Strip optional leading emojis and whitespace
  const withoutEmoji = trimmed.replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '');
  const prefixMatch = /^(Note|Information|Info|Warning|Caution|Alert|Critical|Danger|Error|Success|Tip|Insight|Recommendation|Idea)\s*[:—–-]\s*(.*)$/iu.exec(withoutEmoji);
  if (prefixMatch) {
    const word = prefixMatch[1].toLowerCase();
    let type: CalloutType = 'note';

    if (['warning', 'caution', 'alert'].includes(word)) type = 'warning';
    else if (['critical', 'danger', 'error'].includes(word)) type = 'critical';
    else if (['success'].includes(word)) type = 'success';
    else if (['tip', 'insight', 'recommendation', 'idea'].includes(word)) type = 'insight';

    return {
      type,
      title: CALLOUT_CONFIGS[type].label,
      cleanedText: prefixMatch[2]?.trim() || '',
      isCallout: true,
    };
  }

  return {
    type: 'quote',
    title: '',
    cleanedText: trimmed,
    isCallout: false,
  };
}

function cleanChildContent(node: React.ReactNode): React.ReactNode {
  if (typeof node === 'string') {
    return node
      .replace(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|ERROR|CRITICAL|SUCCESS|INSIGHT)\]\s*/i, '')
      .replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]*(Note|Information|Info|Warning|Caution|Alert|Critical|Danger|Error|Success|Tip|Insight|Recommendation|Idea)\s*[:—–-]\s*/iu, '');
  }
  if (Array.isArray(node)) {
    return node.map((child, i) => (i === 0 ? cleanChildContent(child) : child));
  }
  if (React.isValidElement(node) && (node.props as any)?.children) {
    return React.cloneElement(node as any, {
      children: cleanChildContent((node.props as any).children),
    });
  }
  return node;
}

interface CalloutBlockProps {
  children: React.ReactNode;
}

export function CalloutBlock({ children }: CalloutBlockProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Extract text representation to check for callout triggers
  let rawText = '';
  if (typeof children === 'string') {
    rawText = children;
  } else if (Array.isArray(children)) {
    rawText = children
      .map((c) => (typeof c === 'string' ? c : c?.props?.children ? String(c.props.children) : ''))
      .join('\n');
  } else if (React.isValidElement(children) && (children.props as any)?.children) {
    const c = (children.props as any).children;
    rawText = Array.isArray(c) ? c.map((x) => (typeof x === 'string' ? x : '')).join('') : String(c);
  }

  const { type, title, isCallout } = parseCalloutContent(rawText);

  // If not a semantic callout, render as polished standard quotation
  if (!isCallout) {
    return (
      <blockquote
        className={`border-l-4 px-4 py-2.5 my-3.5 rounded-r-xl italic text-sm leading-relaxed transition-colors ${
          isDark
            ? 'border-emerald-500/80 bg-emerald-500/5 text-slate-300'
            : 'border-emerald-600 bg-emerald-50/60 text-slate-800'
        }`}
      >
        {children}
      </blockquote>
    );
  }

  const config = CALLOUT_CONFIGS[type];
  const Icon = config.icon;

  return (
    <div
      role="region"
      aria-label={`${config.label} callout`}
      className={`relative my-4 rounded-xl border p-4 transition-all ${
        isDark
          ? `${config.borderDark} ${config.bgDark} ${config.textDark}`
          : `${config.borderLight} ${config.bgLight} ${config.textLight}`
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 mt-0.5 ${isDark ? config.iconDark : config.iconLight}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 text-sm leading-relaxed space-y-1">
          {title && (
            <div className={`font-semibold text-xs tracking-wide uppercase ${isDark ? config.iconDark : config.iconLight}`}>
              {title}
            </div>
          )}
          <div className="callout-body">{cleanChildContent(children)}</div>
        </div>
      </div>
    </div>
  );
}

export default CalloutBlock;
