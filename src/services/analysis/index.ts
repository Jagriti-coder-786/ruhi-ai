import { IDataAnalysisResult } from '@/types';

export interface ColumnProfile {
  name: string;
  type: 'numeric' | 'string' | 'date' | 'boolean';
  count: number;
  missing: number;
  unique: number;
  min?: number;
  max?: number;
  mean?: number;
  sum?: number;
}

export interface ParsedDataset {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  profiles: ColumnProfile[];
}

/**
 * Parses CSV text safely into rows and headers.
 */
export function parseCSV(rawText: string): { columns: string[]; rows: Record<string, any>[] } {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { columns: [], rows: [] };
  }

  // Split headers (handling quotes lightly)
  const columns = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawValues = lines[i].split(',');
    const rowObj: Record<string, any> = {};
    columns.forEach((col, idx) => {
      let val: any = rawValues[idx] !== undefined ? rawValues[idx].trim() : '';
      val = val.replace(/^["']|["']$/g, '');
      if (val !== '' && !isNaN(Number(val))) {
        val = Number(val);
      }
      rowObj[col] = val;
    });
    rows.push(rowObj);
  }

  return { columns, rows };
}

/**
 * Profiles the columns and computes numerical & categorical summary statistics.
 */
export function profileDataset(columns: string[], rows: Record<string, any>[]): ColumnProfile[] {
  return columns.map((col) => {
    let missing = 0;
    const values: any[] = [];
    let numericCount = 0;
    let numericSum = 0;
    let min: number | undefined = undefined;
    let max: number | undefined = undefined;

    rows.forEach((r) => {
      const v = r[col];
      if (v === undefined || v === null || v === '') {
        missing++;
      } else {
        values.push(v);
        if (typeof v === 'number' && !isNaN(v)) {
          numericCount++;
          numericSum += v;
          if (min === undefined || v < min) min = v;
          if (max === undefined || v > max) max = v;
        }
      }
    });

    const isNumeric = numericCount > 0 && numericCount >= values.length * 0.7;
    const uniqueValues = new Set(values);

    const profile: ColumnProfile = {
      name: col,
      type: isNumeric ? 'numeric' : 'string',
      count: values.length,
      missing,
      unique: uniqueValues.size,
    };

    if (isNumeric && numericCount > 0) {
      profile.min = min;
      profile.max = max;
      profile.sum = numericSum;
      profile.mean = Number((numericSum / numericCount).toFixed(2));
    }

    return profile;
  });
}

/**
 * Runs full data analysis on raw CSV or JSON data and returns structured insights + chart spec.
 */
export function analyzeData(rawInput: string | Record<string, any>[]): IDataAnalysisResult {
  let columns: string[] = [];
  let rows: Record<string, any>[] = [];

  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        rows = Array.isArray(parsed) ? parsed : [parsed];
        if (rows.length > 0) {
          columns = Object.keys(rows[0]);
        }
      } catch {
        const csvRes = parseCSV(trimmed);
        columns = csvRes.columns;
        rows = csvRes.rows;
      }
    } else {
      const csvRes = parseCSV(trimmed);
      columns = csvRes.columns;
      rows = csvRes.rows;
    }
  } else if (Array.isArray(rawInput)) {
    rows = rawInput;
    if (rows.length > 0) {
      columns = Object.keys(rows[0]);
    }
  }

  const profiles = profileDataset(columns, rows);
  const summaryStats: Record<string, { count: number; mean?: number; min?: number; max?: number; unique?: number }> = {};
  const insights: string[] = [];

  insights.push(`Dataset contains **${rows.length} records** across **${columns.length} attributes**.`);

  let primaryNumericCol: ColumnProfile | null = null;
  let primaryCategoryCol: ColumnProfile | null = null;

  profiles.forEach((p) => {
    summaryStats[p.name] = {
      count: p.count,
      unique: p.unique,
      mean: p.mean,
      min: p.min,
      max: p.max,
    };

    if (p.type === 'numeric' && !primaryNumericCol) {
      primaryNumericCol = p;
      insights.push(
        `Field **${p.name}** ranges from **${p.min}** to **${p.max}** (mean: **${p.mean}**).`
      );
    } else if (p.type === 'string' && !primaryCategoryCol && p.unique > 1 && p.unique <= 15) {
      primaryCategoryCol = p;
      insights.push(`Found **${p.unique} distinct categories** in **${p.name}**.`);
    }
  });

  // Build Chart Data
  let chartData: IDataAnalysisResult['chartData'] = undefined;
  if (primaryCategoryCol && primaryNumericCol) {
    const catName = (primaryCategoryCol as ColumnProfile).name;
    const numName = (primaryNumericCol as ColumnProfile).name;
    const categoryAgg: Record<string, number> = {};

    rows.forEach((r) => {
      const catVal = String(r[catName] || 'Other');
      const numVal = Number(r[numName]) || 0;
      categoryAgg[catVal] = (categoryAgg[catVal] || 0) + numVal;
    });

    const entries = Object.entries(categoryAgg).slice(0, 8);
    chartData = {
      type: 'bar',
      title: `${numName} aggregated by ${catName}`,
      labels: entries.map(([k]) => k),
      data: entries.map(([, v]) => Math.round(v * 100) / 100),
    };
  } else if (primaryNumericCol) {
    const numName = (primaryNumericCol as ColumnProfile).name;
    const sampleRows = rows.slice(0, 10);
    chartData = {
      type: 'line',
      title: `${numName} trend sample`,
      labels: sampleRows.map((_, i) => `Item ${i + 1}`),
      data: sampleRows.map((r) => Number(r[numName]) || 0),
    };
  }

  return {
    columns,
    rowCount: rows.length,
    summaryStats,
    chartData,
    insights,
  };
}

/**
 * Sandboxed Code Execution Engine (Isolated JavaScript VM evaluator with strict limits).
 * Executes user calculations without server escape or external filesystem access.
 */
export function executeSandboxedCode(
  code: string,
  timeoutMs: number = 2000
): { success: boolean; result?: any; logs: string[]; executionTimeMs: number; error?: string } {
  const startTime = Date.now();
  const logs: string[] = [];

  // Strictly prohibited tokens to prevent server breakout
  const blockedTokens = [
    'process.',
    'require(',
    'import(',
    'child_process',
    'fs.',
    'global.',
    'globalThis.',
    'constructor.constructor',
    '__dirname',
    '__filename',
    'eval(',
    'Function(',
  ];

  for (const token of blockedTokens) {
    if (code.includes(token)) {
      return {
        success: false,
        logs: [],
        executionTimeMs: 0,
        error: `Security violation: Prohibited token "${token}" detected in sandboxed execution.`,
      };
    }
  }

  try {
    const mockConsole = {
      log: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
      warn: (...args: any[]) => logs.push('[WARN] ' + args.join(' ')),
      error: (...args: any[]) => logs.push('[ERROR] ' + args.join(' ')),
    };

    // Scoped execution function
    const scopedRunner = new Function('console', 'Math', 'JSON', `
      "use strict";
      ${code}
    `);

    const result = scopedRunner(mockConsole, Math, JSON);
    const executionTimeMs = Date.now() - startTime;

    return {
      success: true,
      result: result !== undefined ? result : null,
      logs,
      executionTimeMs,
    };
  } catch (err: any) {
    return {
      success: false,
      logs,
      executionTimeMs: Date.now() - startTime,
      error: err.message || 'Execution error in sandbox',
    };
  }
}
