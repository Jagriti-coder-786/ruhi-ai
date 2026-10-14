'use client';

import React from 'react';
import { BarChart3, Table as TableIcon } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

export interface ChartDatum {
  label: string;
  value: number;
  unit?: string;
  color?: string;
}

export interface ChartConfig {
  type?: 'bar' | 'column' | 'metrics';
  title?: string;
  data: ChartDatum[];
}

interface ChartBlockProps {
  code: string;
}

export function parseChartData(raw: string): ChartConfig | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
      return {
        type: parsed.type || 'bar',
        title: parsed.title || 'Metrics Chart',
        data: parsed.data.map((d: any) => ({
          label: String(d.label || d.name || 'Item'),
          value: Number(d.value || d.val || 0),
          unit: d.unit ? String(d.unit) : '',
          color: d.color,
        })),
      };
    }
  } catch {
    // Try simple key-value lines
    const lines = raw.trim().split('\n').filter(Boolean);
    const data: ChartDatum[] = [];
    for (const line of lines) {
      const match = /^([^:=]+)[:=]\s*([0-9.]+)\s*(.*)$/.exec(line.trim());
      if (match) {
        data.push({
          label: match[1].trim(),
          value: parseFloat(match[2]),
          unit: match[3]?.trim(),
        });
      }
    }
    if (data.length > 1) {
      return {
        type: 'bar',
        title: 'Metric Summary',
        data,
      };
    }
  }
  return null;
}

export function ChartBlock({ code }: ChartBlockProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const config = parseChartData(code);

  // If chart cannot be parsed, fallback gracefully to accessible table
  if (!config || config.data.length === 0) {
    return (
      <div className="my-4 rounded-xl border border-slate-700/60 p-4 font-mono text-xs bg-slate-900/60 text-slate-300">
        <div className="flex items-center gap-2 mb-2 text-slate-400">
          <TableIcon className="w-4 h-4 text-emerald-400" />
          <span>Metric Data</span>
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap">{code}</pre>
      </div>
    );
  }

  const maxValue = Math.max(...config.data.map((d) => d.value), 1);

  return (
    <div
      role="region"
      aria-label={config.title}
      className={`my-5 rounded-2xl border p-4 sm:p-5 shadow-lg transition-all ${
        isDark
          ? 'border-emerald-500/25 bg-[#090e1a] shadow-emerald-950/20'
          : 'border-slate-200 bg-white shadow-slate-200/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-emerald-500/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
          <h4 className={`text-xs sm:text-sm font-semibold truncate ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
            {config.title}
          </h4>
        </div>
        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
          Visual Chart
        </span>
      </div>

      {/* Horizontal Bar Chart Items */}
      <div className="space-y-3.5">
        {config.data.map((item, idx) => {
          const pct = Math.min(Math.round((item.value / maxValue) * 100), 100);
          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {item.label}
                </span>
                <span className={`font-mono font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  {item.value} {item.unit}
                </span>
              </div>
              <div
                className={`h-2.5 w-full rounded-full overflow-hidden ${
                  isDark ? 'bg-slate-800' : 'bg-slate-100'
                }`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ChartBlock;
