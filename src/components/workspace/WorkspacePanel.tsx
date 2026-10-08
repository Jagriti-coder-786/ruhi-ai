'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Code2,
  Table2,
  Presentation,
  Play,
  Copy,
  Download,
  Plus,
  Trash2,
  Save,
  Check,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { executeSandboxedCode } from '@/services/analysis';

export type WorkspaceTab = 'document' | 'code' | 'spreadsheet' | 'presentation' | 'table' | 'chart' | 'diagram' | 'interactive';

interface Slide {
  id: string;
  title: string;
  bullets: string[];
  notes?: string;
}

interface WorkspacePanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string | null;
  initialType?: WorkspaceTab;
  initialContent?: string;
  initialTitle?: string;
}

export function WorkspacePanel({
  isOpen,
  onClose,
  conversationId,
  initialType = 'document',
  initialContent,
  initialTitle,
}: WorkspacePanelProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialType);
  const [title, setTitle] = useState(initialTitle || 'Ruhi AI Workspace Document');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Document state
  const [docContent, setDocContent] = useState(
    initialContent ||
      `# Executive Architecture & Research Report\n\n## Overview\nThis workspace artifact was synthesized by Ruhi AI. You can edit, format, or refine it here directly.\n\n### Key Highlights\n- Unified multi-model orchestration\n- Grounded citations & real-time verification\n- Multi-modal artifact manipulation`
  );

  // Code state
  const [codeContent, setCodeContent] = useState(
    `// Ruhi AI Sandboxed Execution Environment\nconst data = [12, 45, 68, 23, 89, 34, 91, 55];\n\nconst mean = data.reduce((a, b) => a + b, 0) / data.length;\nconst max = Math.max(...data);\nconst min = Math.min(...data);\n\nconsole.log("Count:", data.length);\nconsole.log("Mean:", mean.toFixed(2));\nconsole.log("Range: [" + min + " - " + max + "]");\n\nreturn { count: data.length, mean, min, max };`
  );
  const [codeLanguage, setCodeLanguage] = useState('typescript');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  // Spreadsheet state
  const [sheetHeaders, setSheetHeaders] = useState(['Item', 'Category', 'Units', 'Unit Price ($)', 'Total ($)']);
  const [sheetRows, setSheetRows] = useState<string[][]>([
    ['Laptops M3', 'Hardware', '15', '1200', '18000'],
    ['4K Displays', 'Peripherals', '25', '350', '8750'],
    ['Cloud GPU Cluster', 'Compute', '4', '2400', '9600'],
    ['AI Gateway Seats', 'Software', '50', '30', '1500'],
  ]);

  // Presentation state
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: '1',
      title: '🌸 Ruhi AI Operating Workspace',
      bullets: [
        'All-round intelligent workspace platform',
        'Multi-model routing (Gemini, Claude, GPT, xAI)',
        'Built-in real-time deep research & verified citations',
      ],
      notes: 'Introduce Ruhi AI vision and integrated multi-provider workspace capability.',
    },
    {
      id: '2',
      title: 'Unified Multimodal Architecture',
      bullets: [
        'Persistent document, code, spreadsheet & deck artifacts',
        'Safe client-sandboxed execution and data profiling',
        'Cross-lingual fluency (English, Hinglish, Hindi, and 12+ Indic languages)',
      ],
      notes: 'Highlight isolation, security, and multilingual intelligence.',
    },
    {
      id: '3',
      title: 'Roadmap & Enterprise Scale',
      bullets: [
        'Secure third-party connectors (Google Drive, GitHub, Slack)',
        'Automated recurring briefings & temporal scheduled tasks',
        'End-to-end audit logging & role-based privacy isolation',
      ],
      notes: 'Discuss scheduled automations and enterprise security posture.',
    },
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Sync initial props
  useEffect(() => {
    if (initialType) setActiveTab(initialType);
    if (initialTitle) setTitle(initialTitle);
    if (initialContent) {
      if (initialType === 'code') setCodeContent(initialContent);
      else setDocContent(initialContent);
    }
  }, [initialType, initialTitle, initialContent]);

  if (!isOpen) return null;

  // Handle Save to Artifacts
  const handleSaveArtifact = async () => {
    try {
      setIsSaving(true);
      let payloadContent = docContent;
      if (activeTab === 'code') payloadContent = codeContent;
      else if (activeTab === 'spreadsheet') payloadContent = JSON.stringify({ headers: sheetHeaders, rows: sheetRows });
      else if (activeTab === 'presentation') payloadContent = JSON.stringify(slides);

      const res = await fetch('/api/artifacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type: activeTab,
          content: payloadContent,
          language: activeTab === 'code' ? codeLanguage : undefined,
          conversationId,
        }),
      });

      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save artifact', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Run Code in Sandbox
  const handleRunCode = () => {
    setConsoleOutput(['[Starting Sandboxed Execution...]']);
    const res = executeSandboxedCode(codeContent);
    const logs = res.logs.length > 0 ? res.logs : ['[No console output logged]'];
    if (res.error) {
      logs.push(`[Execution Error]: ${res.error}`);
    } else {
      logs.push(`[Finished in ${res.executionTimeMs}ms]`);
    }
    setConsoleOutput(logs);
    setExecutionResult(res.result !== undefined ? JSON.stringify(res.result, null, 2) : null);
  };

  // Copy current active content
  const handleCopy = () => {
    let textToCopy = docContent;
    if (activeTab === 'code') textToCopy = codeContent;
    else if (activeTab === 'spreadsheet') {
      textToCopy = [sheetHeaders.join('\t'), ...sheetRows.map((r) => r.join('\t'))].join('\n');
    } else if (activeTab === 'presentation') {
      textToCopy = slides.map((s, i) => `Slide ${i + 1}: ${s.title}\n${s.bullets.map((b) => `- ${b}`).join('\n')}`).join('\n\n');
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download content
  const handleDownload = () => {
    let filename = `${title.toLowerCase().replace(/\s+/g, '_')}`;
    let blob: Blob;

    if (activeTab === 'document') {
      filename += '.md';
      blob = new Blob([docContent], { type: 'text/markdown' });
    } else if (activeTab === 'code') {
      filename += codeLanguage === 'python' ? '.py' : codeLanguage === 'javascript' ? '.js' : '.ts';
      blob = new Blob([codeContent], { type: 'text/plain' });
    } else if (activeTab === 'spreadsheet') {
      filename += '.csv';
      const csvStr = [sheetHeaders.join(','), ...sheetRows.map((r) => r.join(','))].join('\n');
      blob = new Blob([csvStr], { type: 'text/csv' });
    } else {
      filename += '.json';
      blob = new Blob([JSON.stringify(slides, null, 2)], { type: 'application/json' });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full z-40 bg-[#0c101d] border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300 ${
        isExpanded ? 'w-full md:w-[75vw] lg:w-[65vw]' : 'w-full md:w-[540px] lg:w-[620px]'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0e1322]">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm font-semibold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-purple-500 focus:outline-none truncate w-full"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleSaveArtifact}
            disabled={isSaving}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
            title="Save to Workspace Artifacts"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved' : isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Copy Content"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Download File"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:block"
            title={isExpanded ? 'Restore width' : 'Expand workspace'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            title="Close workspace"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center px-4 bg-[#090d18] border-b border-slate-800/80 gap-1 overflow-x-auto custom-scrollbar">
        {[
          { tab: 'document' as WorkspaceTab, name: 'Document', icon: FileText },
          { tab: 'code' as WorkspaceTab, name: 'Code Sandbox', icon: Code2 },
          { tab: 'spreadsheet' as WorkspaceTab, name: 'Spreadsheet', icon: Table2 },
          { tab: 'presentation' as WorkspaceTab, name: 'Presentation', icon: Presentation },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-all shrink-0 ${
                isActive
                  ? 'border-purple-500 text-white bg-purple-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* Workspace Panel Body */}
      <div className="flex-1 overflow-hidden flex flex-col p-4">
        {/* TAB 1: DOCUMENT */}
        {activeTab === 'document' && (
          <div className="flex-1 flex flex-col h-full space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800/60">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Markdown Document Editor
              </span>
              <span>{docContent.trim().split(/\s+/).filter(Boolean).length} words</span>
            </div>
            <textarea
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Write or paste your markdown document here..."
              className="flex-1 w-full p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:border-purple-500/80 custom-scrollbar"
            />
          </div>
        )}

        {/* TAB 2: CODE SANDBOX */}
        {activeTab === 'code' && (
          <div className="flex-1 flex flex-col h-full space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500 font-mono"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="json">JSON</option>
                  <option value="sql">SQL</option>
                </select>
                <span className="text-[11px] text-slate-500 hidden sm:inline">Client Sandboxed Execution</span>
              </div>
              <button
                onClick={handleRunCode}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Sandbox
              </button>
            </div>

            {/* Code Editor */}
            <div className="flex-1 min-h-[160px] flex flex-col">
              <textarea
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="// Enter sandboxed JavaScript/TypeScript or Python code..."
                className="flex-1 w-full p-3.5 bg-[#080b14] border border-slate-800 rounded-2xl text-cyan-300 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:border-cyan-500/80 custom-scrollbar"
              />
            </div>

            {/* Console Output Terminal */}
            <div className="h-44 bg-[#05070d] border border-slate-800/80 rounded-2xl p-3 flex flex-col font-mono text-xs">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80 text-[11px] text-slate-500">
                <span>TERMINAL OUTPUT</span>
                {executionResult && <span className="text-emerald-400">Returned Result</span>}
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar text-slate-300">
                {consoleOutput.length === 0 ? (
                  <span className="text-slate-600 italic">Click "Run Sandbox" to execute code safely.</span>
                ) : (
                  consoleOutput.map((log, i) => (
                    <div key={i} className="leading-tight text-slate-300">
                      {log}
                    </div>
                  ))
                )}
                {executionResult && (
                  <pre className="mt-2 p-2 rounded-lg bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 text-[11px]">
                    {executionResult}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SPREADSHEET */}
        {activeTab === 'spreadsheet' && (
          <div className="flex-1 flex flex-col h-full space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
              <span className="text-xs text-slate-400">
                Interactive Grid • {sheetRows.length} rows × {sheetHeaders.length} columns
              </span>
              <button
                onClick={() => setSheetRows([...sheetRows, new Array(sheetHeaders.length).fill('')])}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>

            <div className="flex-1 overflow-auto border border-slate-800 rounded-2xl bg-slate-900/40 custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                    <th className="p-2.5 w-10 text-center border-r border-slate-800/60">#</th>
                    {sheetHeaders.map((header, hIdx) => (
                      <th key={hIdx} className="p-2.5 border-r border-slate-800/60 font-semibold text-slate-300">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheetRows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="p-2 text-center text-slate-500 font-mono border-r border-slate-800/60">
                        {rIdx + 1}
                      </td>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-1 border-r border-slate-800/60">
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => {
                              const newRows = [...sheetRows];
                              newRows[rIdx][cIdx] = e.target.value;
                              setSheetRows(newRows);
                            }}
                            className="w-full px-2 py-1 bg-transparent text-white focus:outline-none focus:bg-purple-950/30 rounded"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PRESENTATION */}
        {activeTab === 'presentation' && (
          <div className="flex-1 flex flex-col h-full space-y-3">
            {/* Slide Navigation */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <button
                  disabled={currentSlideIndex === 0}
                  onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-slate-300 font-mono">
                  Slide {currentSlideIndex + 1} of {slides.length}
                </span>
                <button
                  disabled={currentSlideIndex === slides.length - 1}
                  onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newSlide: Slide = {
                      id: String(Date.now()),
                      title: 'New Slide Title',
                      bullets: ['Key point 1', 'Key point 2'],
                      notes: '',
                    };
                    setSlides([...slides, newSlide]);
                    setCurrentSlideIndex(slides.length);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Slide
                </button>
                {slides.length > 1 && (
                  <button
                    onClick={() => {
                      setSlides(slides.filter((_, idx) => idx !== currentSlideIndex));
                      setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
                    }}
                    className="p-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Current Slide Card Display */}
            {slides[currentSlideIndex] && (
              <div className="flex-1 flex flex-col p-6 rounded-3xl bg-gradient-to-br from-[#12192c] to-[#0c101d] border border-slate-800/80 shadow-2xl space-y-4">
                <input
                  type="text"
                  value={slides[currentSlideIndex].title}
                  onChange={(e) => {
                    const updated = [...slides];
                    updated[currentSlideIndex].title = e.target.value;
                    setSlides(updated);
                  }}
                  className="text-lg font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-purple-500 focus:outline-none w-full"
                />

                <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                  {slides[currentSlideIndex].bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => {
                          const updated = [...slides];
                          updated[currentSlideIndex].bullets[bIdx] = e.target.value;
                          setSlides(updated);
                        }}
                        className="flex-1 text-xs text-slate-300 bg-transparent border-b border-transparent hover:border-slate-800 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  ))}

                  <button
                    onClick={() => {
                      const updated = [...slides];
                      updated[currentSlideIndex].bullets.push('New key takeaway point');
                      setSlides(updated);
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 pt-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add bullet
                  </button>
                </div>

                {/* Presenter Notes */}
                <div className="pt-3 border-t border-slate-800/60">
                  <span className="text-[11px] font-medium text-slate-400">Presenter Notes</span>
                  <input
                    type="text"
                    value={slides[currentSlideIndex].notes || ''}
                    onChange={(e) => {
                      const updated = [...slides];
                      updated[currentSlideIndex].notes = e.target.value;
                      setSlides(updated);
                    }}
                    placeholder="Notes for speaking..."
                    className="w-full mt-1 text-xs text-slate-400 italic bg-transparent border-none focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
