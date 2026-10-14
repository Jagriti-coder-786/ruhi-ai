'use client';

import React, { useState, useMemo } from 'react';
import katex from 'katex';
import { Sigma, Copy, Check, Code2, Eye, AlertCircle } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

interface MathBlockProps {
  code: string;
  displayMode?: boolean;
}

export function MathBlock({ code, displayMode = true }: MathBlockProps) {
  const { theme } = useTheme();
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);

  const cleanFormula = code.trim().replace(/^\\\[/, '').replace(/\\\]$/, '').trim();

  const { html, error } = useMemo(() => {
    try {
      const rendered = katex.renderToString(cleanFormula, {
        displayMode,
        throwOnError: false,
        strict: false,
      });
      return { html: rendered, error: null };
    } catch (err: any) {
      return { html: null, error: err?.message || 'Failed to render math expression' };
    }
  }, [cleanFormula, displayMode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanFormula);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`relative my-4 rounded-2xl overflow-hidden border shadow-lg transition-all ${
        isDark
          ? 'border-emerald-500/20 bg-[#080d19] shadow-emerald-950/20'
          : 'border-slate-200 bg-white shadow-slate-200/50'
      }`}
    >
      {/* Header Bar */}
      <div
        className={`flex items-center justify-between px-3.5 py-2 border-b text-xs ${
          isDark
            ? 'bg-slate-900/90 border-emerald-500/15 text-slate-300'
            : 'bg-slate-100/90 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center ${
              isDark
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
            }`}
          >
            <Sigma className="w-3.5 h-3.5" />
          </div>
          <span className={`font-semibold text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
            LaTeX Formula
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Toggle Source/Formula */}
          <button
            onClick={() => setShowSource(!showSource)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900'
            }`}
            title={showSource ? 'View Formatted Equation' : 'View LaTeX Source'}
          >
            {showSource ? (
              <>
                <Eye className="w-3 h-3 text-emerald-400" />
                <span>Equation</span>
              </>
            ) : (
              <>
                <Code2 className="w-3 h-3" />
                <span>LaTeX</span>
              </>
            )}
          </button>

          {/* Copy LaTeX */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900'
            }`}
            title="Copy LaTeX formula"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Equation / Source Content with internal overflow scrolling */}
      {showSource ? (
        <div
          className={`p-3.5 overflow-x-auto font-mono text-xs leading-relaxed ${
            isDark ? 'bg-[#070b14] text-slate-200' : 'bg-slate-900 text-slate-100'
          }`}
        >
          <pre className="!bg-transparent !m-0 !p-0">
            <code>{cleanFormula}</code>
          </pre>
        </div>
      ) : error ? (
        <div className="p-3 bg-amber-500/5 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <div
          className={`p-4 overflow-x-auto max-w-full flex justify-center items-center select-none text-base sm:text-lg ${
            isDark ? 'text-slate-100 bg-[#070b14]' : 'text-slate-900 bg-white'
          }`}
        >
          <div
            className="w-fit max-w-full overflow-x-auto custom-scrollbar py-1"
            dangerouslySetInnerHTML={{ __html: html || '' }}
          />
        </div>
      )}
    </div>
  );
}

export default MathBlock;
