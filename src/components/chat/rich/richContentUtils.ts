/**
 * Helpers for detecting and extracting Rich UI content in Ruhi AI responses
 */

import React from 'react';
import { TimelineStepItem } from './ConnectedTimeline';

/**
 * Checks if a fenced markdown code block contains only a presentation table
 */
export function isFencedMarkdownTable(code: string): boolean {
  if (!code) return false;
  const trimmed = code.trim();
  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;

  // Header line must start and end with |
  if (!lines[0].startsWith('|') || !lines[0].endsWith('|')) return false;

  // Delimiter line must match |--|--|
  if (!/^\|[-: |]+\|$/.test(lines[1])) return false;

  // All remaining lines must also be table rows
  for (let i = 2; i < lines.length; i++) {
    if (!lines[i].startsWith('|') || !lines[i].endsWith('|')) return false;
  }

  return true;
}

/**
 * Parses raw text from a ```timeline or ```steps block into TimelineStepItem[]
 */
export function parseTimelineFromText(text: string): TimelineStepItem[] {
  const lines = text.trim().split('\n');
  const steps: TimelineStepItem[] = [];
  let currentStep: TimelineStepItem | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Matches e.g. "01 — Create project", "1. Install dependencies", "Step 1: Setup"
    const headerMatch = /^([0-9]+|Step\s+[0-9]+|Phase\s+[0-9]+)\s*[:—–-]\s*(.*)$/i.exec(trimmed);
    if (headerMatch) {
      if (currentStep) {
        steps.push(currentStep);
      }
      currentStep = {
        number: headerMatch[1].replace(/^(Step|Phase)\s+/i, ''),
        title: headerMatch[2].trim(),
        description: '',
      };
    } else if (currentStep) {
      currentStep.description = (currentStep.description ? currentStep.description + ' ' : '') + trimmed;
    }
  }

  if (currentStep) {
    steps.push(currentStep);
  }

  return steps;
}

/**
 * Checks if an ordered list's children represent distinct sequential procedural steps
 */
export function extractProceduralSteps(children: React.ReactNode): TimelineStepItem[] | null {
  if (!children) return null;
  const childArray = React.Children.toArray(children);
  if (childArray.length < 2 || childArray.length > 12) return null;

  const steps: TimelineStepItem[] = [];
  let isProcedural = false;

  for (let idx = 0; idx < childArray.length; idx++) {
    const item = childArray[idx];
    if (!React.isValidElement(item)) continue;

    const props: any = item.props || {};
    const itemChildren = props.children;

    let fullText = '';
    if (typeof itemChildren === 'string') {
      fullText = itemChildren;
    } else if (Array.isArray(itemChildren)) {
      fullText = itemChildren
        .map((c) => (typeof c === 'string' ? c : c?.props?.children ? String(c.props.children) : ''))
        .join(' ');
    }

    const trimmed = fullText.trim();

    // Check for bold title or explicit "Step" or long procedural instructions
    const stepMatch = /^(?:\*\*(.*?)\*\*|(Step\s+\d+|Phase\s+\d+|Stage\s+\d+)\s*[:—–-])\s*(.*)$/i.exec(trimmed);

    if (stepMatch) {
      isProcedural = true;
      const title = (stepMatch[1] || stepMatch[2] || `Step ${idx + 1}`).trim();
      const desc = stepMatch[3]?.trim();
      steps.push({
        number: idx + 1,
        title,
        description: desc,
        children: itemChildren,
      });
    } else if (trimmed.length > 40 && (trimmed.includes(':') || trimmed.includes('—') || trimmed.includes('–'))) {
      // e.g. "Create database: Run migrations and seed starter users."
      const parts = trimmed.split(/[:—–]/);
      if (parts.length >= 2 && parts[0].length < 50) {
        isProcedural = true;
        steps.push({
          number: idx + 1,
          title: parts[0].trim(),
          description: parts.slice(1).join(':').trim(),
          children: itemChildren,
        });
      }
    }
  }

  if (isProcedural && steps.length >= 2) {
    return steps;
  }

  return null;
}
