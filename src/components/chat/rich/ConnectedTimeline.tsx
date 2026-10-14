'use client';

import React, { useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

export interface TimelineStepItem {
  number: string | number;
  title: string;
  description?: string;
  children?: React.ReactNode;
  code?: string;
  isActionable?: boolean;
}

interface ConnectedTimelineProps {
  title?: string;
  steps: TimelineStepItem[];
}

export function ConnectedTimeline({ title, steps }: ConnectedTimelineProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Independent completion state for actionable steps
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (!steps || steps.length === 0) return null;

  return (
    <div
      role="region"
      aria-label={title || 'Sequential Procedure Timeline'}
      className={`relative my-6 rounded-2xl border p-5 shadow-lg transition-all ${
        isDark
          ? 'border-emerald-500/25 bg-[#090e1a] shadow-emerald-950/20'
          : 'border-slate-200 bg-white shadow-slate-200/50'
      }`}
    >
      {/* Optional Timeline Header */}
      {title && (
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h4
            className={`text-sm font-semibold tracking-wide uppercase ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}
          >
            {title}
          </h4>
        </div>
      )}

      {/* Connected Steps Flow */}
      <div className="relative">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isDone = Boolean(completedSteps[idx]);
          const displayNum =
            typeof step.number === 'number'
              ? String(step.number).padStart(2, '0')
              : String(step.number || idx + 1).padStart(2, '0');

          return (
            <div key={idx} className="relative flex items-start gap-3.5 sm:gap-4 pb-6 last:pb-1 group">
              {/* Connecting Line (Vertical) */}
              {!isLast && (
                <div
                  aria-hidden="true"
                  className={`absolute left-4 top-8 bottom-0 w-0.5 -translate-x-1/2 transition-colors ${
                    isDone
                      ? 'bg-emerald-500'
                      : isDark
                      ? 'bg-gradient-to-b from-emerald-500/60 to-emerald-500/20'
                      : 'bg-gradient-to-b from-emerald-500/40 to-slate-200'
                  }`}
                />
              )}

              {/* Numbered Circular Marker */}
              <button
                type="button"
                onClick={() => toggleStep(idx)}
                aria-label={`Step ${displayNum}: ${step.title}. ${isDone ? 'Mark as incomplete' : 'Mark as complete'}`}
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all shrink-0 select-none ${
                  isDone
                    ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-md shadow-emerald-500/30'
                    : isDark
                    ? 'border-2 border-emerald-500 bg-[#0f172a] text-emerald-300 ring-4 ring-emerald-500/10 hover:border-emerald-400'
                    : 'border-2 border-emerald-600 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-600/10 hover:border-emerald-700'
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : displayNum}
              </button>

              {/* Step Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h5
                    className={`text-sm font-semibold leading-snug transition-colors ${
                      isDone
                        ? 'line-through text-slate-400'
                        : isDark
                        ? 'text-slate-100 group-hover:text-emerald-300'
                        : 'text-slate-900 group-hover:text-emerald-700'
                    }`}
                  >
                    {step.title}
                  </h5>
                  {step.isActionable && (
                    <span
                      onClick={() => toggleStep(idx)}
                      className="cursor-pointer text-[10px] uppercase font-mono px-1.5 py-0.5 rounded text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      {isDone ? 'Completed' : 'Action'}
                    </span>
                  )}
                </div>

                {/* Description / Code / Child details */}
                {step.description ? (
                  <p
                    className={`mt-1.5 text-xs sm:text-sm leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {step.description}
                  </p>
                ) : step.children ? (
                  <div className="mt-1.5 text-xs sm:text-sm">{step.children}</div>
                ) : null}

                {step.code && (
                  <div className="mt-2.5 rounded-lg overflow-hidden border border-slate-700/60 bg-[#050811] p-2.5 font-mono text-xs text-emerald-300">
                    <code>{step.code}</code>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ConnectedTimeline;
