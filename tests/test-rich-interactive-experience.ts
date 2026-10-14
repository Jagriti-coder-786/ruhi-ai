/**
 * Ruhi AI — Ultra Rich Interactive Experience Verification Suite
 * Tests Timelines, Callouts, Checklists, Charts, Tables, and Hierarchy
 */

import { parseCalloutContent } from '../src/components/chat/rich/CalloutBlock';
import { isFencedMarkdownTable, parseTimelineFromText } from '../src/components/chat/rich/richContentUtils';
import { parseChartData } from '../src/components/chat/rich/ChartBlock';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runRichExperienceSuite() {
  console.log('\n=================================================================');
  console.log('🌟 RUHI AI: ULTRA RICH INTERACTIVE EXPERIENCE VERIFICATION');
  console.log('=================================================================\n');

  // -------------------------------------------------------------
  // Test A & F: Semantic Callouts (5 Types & Emoji Normalization)
  // -------------------------------------------------------------
  console.log('• 1. Semantic Callout Parsing & Type Resolution (Part 7)');

  const noteAlert = parseCalloutContent('[!NOTE]\nThis is a standard informational note.');
  assert(noteAlert.isCallout === true && noteAlert.type === 'note', 'Resolves [!NOTE] to blue Note callout');

  const successAlert = parseCalloutContent('[!SUCCESS]\nDeployment completed successfully.');
  assert(successAlert.isCallout === true && successAlert.type === 'success', 'Resolves [!SUCCESS] to green Success callout');

  const warningAlert = parseCalloutContent('⚠️ Warning: Deprecated API version in use.');
  assert(warningAlert.isCallout === true && warningAlert.type === 'warning', 'Resolves emoji "⚠️ Warning:" to amber Warning callout');

  const criticalAlert = parseCalloutContent('[!CRITICAL]\nImmediate database credential rotation required.');
  assert(criticalAlert.isCallout === true && criticalAlert.type === 'critical', 'Resolves [!CRITICAL] to red Critical callout');

  const insightAlert = parseCalloutContent('💡 Insight: Using Turbopack cuts compilation time by 80%.');
  assert(insightAlert.isCallout === true && insightAlert.type === 'insight', 'Resolves emoji "💡 Insight:" to violet Insight callout');

  const standardQuote = parseCalloutContent('"Simplicity is prerequisite for reliability." — Edsger W. Dijkstra');
  assert(standardQuote.isCallout === false && standardQuote.type === 'quote', 'Preserves ordinary quotes as standard blockquote');

  // -------------------------------------------------------------
  // Test B: Connected Timeline Parsing (Part 4)
  // -------------------------------------------------------------
  console.log('\n• 2. Connected Timeline Procedural Parsing (Part 4)');
  const timelineText = `
01 — Create project
Run npm create next-app to initialize workspace.

02 — Install dependencies
Install tailwindcss, lucide-react, and mermaid.

03 — Add starter components
Implement rich UI blocks and Markdown renderer.

04 — Run development server
Execute npm run dev to verify interactive experience.
  `.trim();

  const parsedSteps = parseTimelineFromText(timelineText);
  assert(parsedSteps.length === 4, 'Correctly extracts all 4 sequential steps');
  assert(parsedSteps[0].number === '01' && parsedSteps[0].title === 'Create project', 'Step 01 title parsed accurately');
  assert(parsedSteps[1].number === '02' && parsedSteps[1].title === 'Install dependencies', 'Step 02 title parsed accurately');
  assert(parsedSteps[3].number === '04' && parsedSteps[3].title === 'Run development server', 'Step 04 title parsed accurately');

  // -------------------------------------------------------------
  // Test D & E: Fenced Markdown Table Detection (Part 6)
  // -------------------------------------------------------------
  console.log('\n• 3. Fenced Markdown Table Fallback (Part 6)');
  const validTable = `
| Technology | Category | Latency | Memory | Status |
|---|---|---|---|---|
| Ruhi AI Core | Orchestrator | 120ms | 32MB | Active |
| Gemini 2.5 Flash | Provider | 185ms | 45MB | Active |
| Claude 3.7 Sonnet | Reasoner | 310ms | 68MB | Active |
  `.trim();

  assert(isFencedMarkdownTable(validTable), 'Detects pure presentation markdown table for visual rendering');

  const notATable = `
# Markdown Header
Here is some text with pipe | symbols | in between.
const x = a | b;
  `.trim();
  assert(!isFencedMarkdownTable(notATable), 'Correctly rejects general code containing pipe characters');

  // -------------------------------------------------------------
  // Test H: Chart Data Parsing (Part 6)
  // -------------------------------------------------------------
  console.log('\n• 4. Chart & Metric Visualization Data (Part 6)');
  const validChartJson = JSON.stringify({
    type: 'bar',
    title: 'Model Response Times (ms)',
    data: [
      { label: 'Ruhi AI', value: 145, unit: 'ms' },
      { label: 'Gemini 2.5', value: 195, unit: 'ms' },
      { label: 'GPT-4o', value: 230, unit: 'ms' },
    ],
  });

  const parsedChart = parseChartData(validChartJson);
  assert(parsedChart !== null && parsedChart.data.length === 3, 'Parses structured JSON chart data with 3 metrics');
  assert(parsedChart?.title === 'Model Response Times (ms)', 'Extracts chart title accurately');
  assert(parsedChart?.data[0].value === 145, 'Extracts metric values accurately');

  const invalidChart = 'invalid non-chart text';
  assert(parseChartData(invalidChart) === null, 'Gracefully returns null for non-chart content (triggers accessible table fallback)');

  // -------------------------------------------------------------
  // Test C: Independent Checklist State Simulation (Part 10)
  // -------------------------------------------------------------
  console.log('\n• 5. Independent Checklist State Logic (Part 10)');
  const initialChecklist = [false, false, true, false, true];
  const checklistState = [...initialChecklist];

  // Toggle item at index 1
  checklistState[1] = !checklistState[1];
  assert(checklistState[1] === true, 'Item 1 toggled to true independently');
  assert(checklistState[0] === false && checklistState[2] === true, 'Item 0 and 2 retained uncorrupted states');

  // Toggle item at index 4
  checklistState[4] = !checklistState[4];
  assert(checklistState[4] === false, 'Item 4 toggled to false independently');
  assert(checklistState[1] === true && checklistState[2] === true, 'Prior toggles remained stable');

  // -------------------------------------------------------------
  // Test I: Mathematical Formula & LaTeX Rendering (KaTeX)
  // -------------------------------------------------------------
  console.log('\n• 6. Mathematical Formula & LaTeX Rendering (KaTeX)');
  const katex = await import('katex').then((m) => m.default || m);
  const validFormula = '\\hat{f}(\\xi) = \\int_{-\\infty}^\\infty f(x)\\,e^{-2\\pi i x \\xi}\\,dx';
  const renderedMath = katex.renderToString(validFormula, { displayMode: true, throwOnError: false });
  assert(renderedMath.includes('katex-display') && renderedMath.includes('math'), 'Renders valid LaTeX formula into display KaTeX HTML/MathML');

  const invalidFormula = '\\unclosed{invalid';
  const fallbackMath = katex.renderToString(invalidFormula, { displayMode: true, throwOnError: false });
  assert(typeof fallbackMath === 'string' && fallbackMath.length > 0, 'Gracefully handles invalid LaTeX syntax without crashing');

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n=================================================================');
  console.log(`RICH EXPERIENCE RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('=================================================================\n');

  if (failed > 0) process.exit(1);
}

runRichExperienceSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
