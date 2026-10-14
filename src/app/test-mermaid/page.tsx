'use client';

import React, { useState } from 'react';
import MarkdownRenderer from '@/components/chat/MarkdownRenderer';
import { useTheme } from '@/providers/ThemeProvider';
import { Sun, Moon, Play } from 'lucide-react';

const TEST_TIMELINE = `## Getting Started with Ruhi AI
Follow this sequential implementation procedure to setup your intelligent workspace:

1. **Initialize Workspace**: Run the starter project scaffolding tool to configure the monorepo and directory conventions.
2. **Configure Multi-Model Orchestration**: Set your API keys in \`.env.local\` to enable instant model routing across Gemini 2.5, Claude 3.7, and GPT-4o.
3. **Setup Streaming Response Pipeline**: Configure SSE streaming with Server-Sent Events to enable instant token delivery.
4. **Deploy Production Build**: Run \`npm run build\` and start your container cluster with zero downtime.`;

const TEST_FENCED_TIMELINE = `## Project Roadmap
\`\`\`timeline
01 — Core Identity & Orchestrator
Implement multi-provider fallback engine and unified context manager.

02 — Rich Interactive UI & Emerald Design
Deploy connected timelines, semantic callouts, and Mermaid diagrams.

03 — Autonomous Task Queue
Support human-in-the-loop task execution with approval gates.

04 — Enterprise Connectors & Sharing
Integrate Google Drive, GitHub, Slack, and public share links.
\`\`\``;

const TEST_CHECKLIST = `### Implementation Verification Checklist
Please verify each step before deploying to production:

- [ ] Configure database connection string and MongoDB pooling
- [ ] Run test suite across all 9 validation suites
- [x] Verify Mermaid diagram rendering in dark and light modes
- [ ] Validate Razorpay webhook HMAC signatures
- [x] Ensure interactive checkboxes maintain state independently`;

const TEST_CALLOUTS = `### Semantic Callout System
> [!NOTE]
> Ruhi AI automatically routes conversational queries to balanced models while reserving deep reasoners for complex code and math.

> [!SUCCESS]
> Database indexes synchronized successfully. Query latency decreased by 65%.

> ⚠️ Warning: Ensure OAuth state tokens are signed with HMAC-SHA256 to prevent CSRF replay attacks.

> [!CRITICAL]
> Database password rotation required. Never commit plain-text credentials to version control.

> 💡 Insight: Using Turbopack and client-side Mermaid rendering cuts initial page bundle size by over 400KB.

> "Simplicity is a prerequisite for reliability." — Edsger W. Dijkstra`;

const TEST_TABLE = `### Technology & Model Comparison Matrix

| Model Identifier | Provider | Max Context | Latency (p50) | Primary Strengths | Status |
|---|---|---|---|---|---|
| ruhi-balanced | Gemini 2.5 Flash | 1,000,000 | 140ms | Real-time chat & multimodal reasoning | Active |
| ruhi-reasoner | Claude 3.7 Sonnet | 200,000 | 320ms | Deep architectural planning & coding | Active |
| ruhi-creative | GPT-4o | 128,000 | 260ms | Natural creative writing & synthesis | Active |
| ruhi-fast | Gemini 2.0 Flash | 1,000,000 | 95ms | Rapid tool calling & classification | Active |`;

const TEST_FENCED_TABLE = `### Fenced Markdown Table Fallback Test
\`\`\`markdown
| Feature | Free Tier | Pro Tier | Enterprise Tier |
|---|---|---|---|
| Daily Queries | 50 | 1,000 | Unlimited |
| Model Access | Balanced | Balanced + Reasoner | All Models + Custom |
| Shared Workspaces | 1 | 5 | Unlimited |
| SLA Guarantee | Standard | 99.9% | 99.99% |
\`\`\``;

const TEST_CHART = `### Performance Benchmark Visualization
\`\`\`chart
{
  "type": "bar",
  "title": "Model Execution Latency (lower is faster)",
  "data": [
    { "label": "Ruhi AI Optimized", "value": 125, "unit": "ms" },
    { "label": "Gemini 2.5 Flash", "value": 175, "unit": "ms" },
    { "label": "Claude 3.7 Sonnet", "value": 310, "unit": "ms" },
    { "label": "GPT-4o Enterprise", "value": 260, "unit": "ms" }
  ]
}
\`\`\``;

const TEST_MERMAID = `### Interactive Architecture Flowchart
\`\`\`mermaid
flowchart TD
    UserQuery([User Query]) --> Auth{Authenticated?}
    Auth -->|Yes| Orchestrator[Intelligent Orchestrator]
    Auth -->|No| LoginModal[Demo Session]
    Orchestrator --> RAG{Needs Search?}
    RAG -->|Yes| Grounding[Live Web Search & Citations]
    RAG -->|No| LLM[Multi-Provider LLM]
    Grounding --> LLM
    LLM --> Streamer[SSE Streaming Pipeline]
    Streamer --> RichRenderer[Markdown & Rich UI Renderer]
    RichRenderer --> VisualOutput([Connected Timeline / Mermaid / Table])
\`\`\``;

const TEST_MIXED_RESPONSE = `# Full Mixed Response Verification
This response contains prose, connected procedural steps, an interactive checklist, semantic callouts, a comparison table, a chart, and a code block.

> [!NOTE]
> All components in this response render cooperatively without layout collisions.

1. **Step 1: Ingest Data**: Stream raw dataset into local sandboxed memory.
2. **Step 2: Profile Metrics**: Calculate mean, standard deviation, and IQR bounds.
3. **Step 3: Generate Visuals**: Render responsive Emerald charts and architecture diagrams.

### Active Tasks
- [x] Verify connected timeline layout
- [ ] Inspect mobile viewport at 360px
- [x] Toggle checklist state independently

\`\`\`javascript
// Ordinary code block must remain code
const pipeline = (input) => {
  return input.trim().toLowerCase();
};
\`\`\`

| Stage | Duration | Outcome |
|---|---|---|
| Ingestion | 12ms | Completed |
| Validation | 4ms | Passed |
| Rendering | 18ms | Interactive |`;

const TEST_LATEX_MATH = `### Mathematical Rendering (LaTeX & KaTeX)
Here is the continuous Fourier transform:

\`\`\`latex
\\hat{f}(\\xi) = \\int_{-\\infty}^\\infty f(x)\\,e^{-2\\pi i x \\xi}\\,dx
\`\`\`

And a wide mathematical formula testing internal horizontal scroll containment at mobile widths:

\`\`\`math
P(x) = \\sum_{k=0}^{n} \\binom{n}{k} p^k (1-p)^{n-k} = \\frac{n!}{k!(n-k)!} \\cdot \\prod_{i=1}^{k} \\lambda_i \\cdot \\exp\\left(-\\frac{(x - \\mu)^2}{2\\sigma^2}\\right) \\cdot \\sqrt{\\frac{1}{2\\pi\\sigma^2}}
\`\`\``;

export default function TestMermaidPage() {
  const { theme, toggleTheme } = useTheme();
  const [streamSimText, setStreamSimText] = useState('Click "Simulate Stream" to test instant rendering...');
  const [isSimStreaming, setIsSimStreaming] = useState(false);

  const startStreamingSimulation = () => {
    setIsSimStreaming(true);
    setStreamSimText('Analyzing request and preparing response...\n\n');

    setTimeout(() => {
      setStreamSimText('Analyzing request and preparing response...\n\n1. **Step 1: Initialize Database**: Connect MongoDB cluster and verify indexes.\n');
    }, 300);

    setTimeout(() => {
      setStreamSimText('Analyzing request and preparing response...\n\n1. **Step 1: Initialize Database**: Connect MongoDB cluster and verify indexes.\n2. **Step 2: Stream Tokens**: Emitting Server-Sent Events to client typewriter.\n');
    }, 600);

    setTimeout(() => {
      setStreamSimText(
        'Analyzing request and preparing response...\n\n1. **Step 1: Initialize Database**: Connect MongoDB cluster and verify indexes.\n2. **Step 2: Stream Tokens**: Emitting Server-Sent Events to client typewriter.\n3. **Step 3: Render Rich UI**: Display connected timeline and interactive components.\n\n> [!SUCCESS]\n> Instant streaming completed with rich component stability!'
      );
      setIsSimStreaming(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#090d16] [data-theme=light]:bg-slate-50 text-slate-100 [data-theme=light]:text-slate-900 p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header Controls */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 [data-theme=light]:border-slate-300">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-400 [data-theme=light]:text-emerald-700">
            Ruhi AI — Ultra Rich UI Verification Suite
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Testing Connected Timelines, Callouts, Checklists, Tables, Charts, and Mermaid
          </p>
        </div>

        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 [data-theme=light]:bg-slate-200 text-xs font-semibold text-slate-200 [data-theme=light]:text-slate-800 hover:bg-slate-700 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-purple-600" />}
          <span>Mode: {theme}</span>
        </button>
      </div>

      {/* Case 1: Connected Timeline (from Markdown procedure) */}
      <section id="section-timeline" className="p-5 rounded-2xl bg-[#0c111e] [data-theme=light]:bg-white border border-slate-800 [data-theme=light]:border-slate-200 shadow-lg">
        <MarkdownRenderer content={TEST_TIMELINE} />
      </section>

      {/* Case 2: Fenced Timeline */}
      <section id="section-fenced-timeline" className="p-5 rounded-2xl bg-[#0c111e] [data-theme=light]:bg-white border border-slate-800 [data-theme=light]:border-slate-200 shadow-lg">
        <MarkdownRenderer content={TEST_FENCED_TIMELINE} />
      </section>

      {/* Case 3: Interactive Checklist */}
      <section id="section-checklist" className="p-5 rounded-2xl bg-[#0c111e] [data-theme=light]:bg-white border border-slate-800 [data-theme=light]:border-slate-200 shadow-lg">
        <MarkdownRenderer content={TEST_CHECKLIST} />
      </section>

      {/* Case 4: Semantic Callouts */}
      <section id="section-callouts" className="p-5 rounded-2xl bg-[#0c111e] [data-theme=light]:bg-white border border-slate-800 [data-theme=light]:border-slate-200 shadow-lg">
        <MarkdownRenderer content={TEST_CALLOUTS} />
      </section>

      {/* Case 5: Styled Table */}
      <section id="section-table" className="p-5 rounded-2xl bg-[#0c111e] [data-theme=light]:bg-white border border-slate-800 [data-theme=light]:border-slate-200 shadow-lg">
        <MarkdownRenderer content={TEST_TABLE} />
      </section>

      {/* Case 6: Fenced Markdown Table Fallback */}
      <section id="section-fenced-table" className="p-5 rounded-2xl bg-[#0c111e] [data-theme=light]:bg-white border border-slate-800 [data-theme=light]:border-slate-200 shadow-lg">
        <MarkdownRenderer content={TEST_FENCED_TABLE} />
      </section>

      {/* Case 7: Visual Metric Chart */}
      <section id="section-chart" className="p-5 rounded-2xl bg-[#0c111e] [data-theme=light]:bg-white border border-slate-800 [data-theme=light]:border-slate-200 shadow-lg">
        <MarkdownRenderer content={TEST_CHART} />
      </section>

      {/* Case 8: Interactive Mermaid Flowchart */}
      <section id="section-mermaid" className="p-5 rounded-2xl bg-[#0c111e] [data-theme=light]:bg-white border border-slate-800 [data-theme=light]:border-slate-200 shadow-lg">
        <MarkdownRenderer content={TEST_MERMAID} />
      </section>

      {/* Case 9: Instant Streaming Simulation */}
      <section id="section-streaming" className="p-5 rounded-2xl bg-[#0c111e] [data-theme=light]:bg-white border border-slate-800 [data-theme=light]:border-slate-200 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-emerald-400">Instant Streaming Simulation</h3>
          <button
            id="start-stream-btn"
            onClick={startStreamingSimulation}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Simulate Stream</span>
          </button>
        </div>
        <MarkdownRenderer content={streamSimText} isStreaming={isSimStreaming} />
      </section>

      {/* Case 10: Mathematical & LaTeX Rendering */}
      <section id="section-math" className="p-5 rounded-2xl bg-[#0c111e] [data-theme=light]:bg-white border border-slate-800 [data-theme=light]:border-slate-200 shadow-lg">
        <MarkdownRenderer content={TEST_LATEX_MATH} />
      </section>

      {/* Case 11: Mixed Response */}
      <section id="section-mixed" className="p-5 rounded-2xl bg-[#0c111e] [data-theme=light]:bg-white border border-slate-800 [data-theme=light]:border-slate-200 shadow-lg">
        <MarkdownRenderer content={TEST_MIXED_RESPONSE} />
      </section>
    </div>
  );
}
