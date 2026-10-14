'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';
import { MermaidBlock } from './diagram/MermaidBlock';
import { isMermaidBlock } from './diagram/mermaidUtils';
import { CalloutBlock } from './rich/CalloutBlock';
import { ConnectedTimeline } from './rich/ConnectedTimeline';
import { InteractiveCheckbox } from './rich/InteractiveChecklist';
import { ChartBlock } from './rich/ChartBlock';
import { MathBlock } from './rich/MathBlock';
import {
  isFencedMarkdownTable,
  parseTimelineFromText,
  extractProceduralSteps,
} from './rich/richContentUtils';
import { Code2, Table as TableIcon } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export function MarkdownRenderer({ content, isStreaming = false }: MarkdownRendererProps) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // ==========================================
          // CODE & SPECIALIZED COMPONENT ROUTING
          // ==========================================
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1].toLowerCase() : '';
            const codeString = String(children).replace(/\n$/, '');

            if (!inline) {
              // 1. Mermaid Flowchart / Sequence / Diagram
              if (isMermaidBlock(lang, codeString)) {
                return (
                  <MermaidBlock
                    code={codeString}
                    isStreaming={isStreaming}
                  />
                );
              }

              // 2. Metrics & Chart Visualizations
              if (lang === 'chart' || lang === 'metrics' || lang === 'json-chart') {
                return <ChartBlock code={codeString} />;
              }

              // 3. Explicit Sequential Timeline Fences
              if (lang === 'timeline' || lang === 'steps') {
                const parsedSteps = parseTimelineFromText(codeString);
                if (parsedSteps.length > 0) {
                  return <ConnectedTimeline steps={parsedSteps} />;
                }
              }

              // 4. Fenced Markdown Table Fallback (Visual Presentation with Source Toggle)
              if ((lang === 'markdown' || lang === 'md' || lang === 'table') && isFencedMarkdownTable(codeString)) {
                return <FencedTablePresentation code={codeString} />;
              }

              // 5. Mathematical & LaTeX Formulae (KaTeX with internal horizontal scroll)
              if (
                lang === 'latex' ||
                lang === 'tex' ||
                lang === 'math' ||
                (codeString.startsWith('$$') && codeString.endsWith('$$'))
              ) {
                const mathCode = (codeString.startsWith('$$') && codeString.endsWith('$$'))
                  ? codeString.slice(2, -2).trim()
                  : codeString;
                return <MathBlock code={mathCode} />;
              }

              // 6. Standard Syntax-Highlighted Code Block
              if (match || codeString.includes('\n')) {
                return (
                  <CodeBlock
                    language={lang}
                    value={codeString}
                  />
                );
              }
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },

          // ==========================================
          // HEADINGS & CONTENT HIERARCHY (Part 9)
          // ==========================================
          h1({ children }) {
            return (
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white [data-theme=light]:text-slate-900 mt-6 mb-3 pb-2 border-b border-emerald-500/20 [data-theme=light]:border-slate-200 first:mt-1">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-emerald-400 [data-theme=light]:text-emerald-700 mt-5 mb-2.5 first:mt-1">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-base sm:text-lg font-medium text-slate-100 [data-theme=light]:text-slate-800 mt-4 mb-2 first:mt-1">
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="text-sm sm:text-base font-medium text-slate-200 [data-theme=light]:text-slate-700 mt-3 mb-1.5 first:mt-1">
                {children}
              </h4>
            );
          },

          // ==========================================
          // ORDERED LISTS & TIMELINE DETECTION (Part 4)
          // ==========================================
          ol({ children }) {
            const proceduralSteps = extractProceduralSteps(children);
            if (proceduralSteps && proceduralSteps.length >= 2) {
              return <ConnectedTimeline steps={proceduralSteps} />;
            }
            return (
              <ol className="list-decimal pl-6 my-3 space-y-1 text-slate-200 [data-theme=light]:text-slate-700">
                {children}
              </ol>
            );
          },

          // ==========================================
          // UNORDERED LISTS & CHECKLISTS (Part 10)
          // ==========================================
          ul({ children, className }) {
            return (
              <ul className={`pl-5 my-3 space-y-1 text-slate-200 [data-theme=light]:text-slate-700 ${className?.includes('contains-task-list') ? 'list-none pl-1' : 'list-disc'}`}>
                {children}
              </ul>
            );
          },
          li({ children, className }: any) {
            if (className?.includes('task-list-item')) {
              return <li className="list-none my-1">{children}</li>;
            }
            return <li className="leading-relaxed">{children}</li>;
          },
          input({ type, checked, ...props }: any) {
            if (type === 'checkbox') {
              return <InteractiveCheckbox checked={Boolean(checked)} />;
            }
            return <input type={type} checked={checked} {...props} />;
          },

          // ==========================================
          // SEMANTIC CALLOUTS (Part 7)
          // ==========================================
          blockquote({ children }) {
            return <CalloutBlock>{children}</CalloutBlock>;
          },

          // ==========================================
          // STRUCTURED TABLES (Part 6 & 8)
          // ==========================================
          table({ children }) {
            return (
              <div className="overflow-x-auto max-w-full my-5 rounded-2xl border border-slate-700/60 [data-theme=light]:border-slate-300 shadow-xl shadow-emerald-950/10 transition-all">
                <table className="w-full text-left text-sm border-collapse min-w-[320px]">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-emerald-950/40 [data-theme=light]:bg-emerald-50/80 border-b-2 border-emerald-500/30 [data-theme=light]:border-emerald-300">
                {children}
              </thead>
            );
          },
          th({ children }) {
            return (
              <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-emerald-300 [data-theme=light]:text-emerald-800 select-none">
                {children}
              </th>
            );
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-slate-800/60 [data-theme=light]:divide-slate-200">{children}</tbody>;
          },
          tr({ children }) {
            return (
              <tr className="hover:bg-emerald-500/5 transition-colors odd:bg-transparent even:bg-slate-900/40 [data-theme=light]:even:bg-slate-50/60">
                {children}
              </tr>
            );
          },
          td({ children }) {
            return (
              <td className="py-3 px-4 text-xs sm:text-sm text-slate-200 [data-theme=light]:text-slate-800 transition-colors">
                {children}
              </td>
            );
          },

          // ==========================================
          // LINKS
          // ==========================================
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors font-medium"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Renders fenced markdown tables visually with a clean toggle to view raw source
 */
function FencedTablePresentation({ code }: { code: string }) {
  const [showSource, setShowSource] = useState(false);

  return (
    <div className="relative my-4">
      <div className="flex justify-end mb-1">
        <button
          onClick={() => setShowSource(!showSource)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title={showSource ? 'View Visual Table' : 'View Markdown Source'}
        >
          {showSource ? (
            <>
              <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Table</span>
            </>
          ) : (
            <>
              <Code2 className="w-3.5 h-3.5" />
              <span>Source</span>
            </>
          )}
        </button>
      </div>

      {showSource ? (
        <CodeBlock language="markdown" value={code} />
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {code}
        </ReactMarkdown>
      )}
    </div>
  );
}

export default MarkdownRenderer;
