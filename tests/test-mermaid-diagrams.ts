/**
 * Ruhi AI — Mermaid Diagram Verification Suite
 * Tests Detection, Parsing, Theme Configuration, Streaming Resilience, and Regression Prevention
 */

import {
  isMermaidBlock,
  isMermaidLanguage,
  isExplicitCodeLanguage,
  detectDiagramType,
  cleanMermaidSource,
  validateMermaidSyntax,
  getMermaidThemeConfig,
} from '../src/components/chat/diagram/mermaidUtils';

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

async function runMermaidSuite() {
  console.log('\n=================================================================');
  console.log('📊 RUHI AI: MERMAID DIAGRAM DETECTION & PARSING VERIFICATION');
  console.log('=================================================================\n');

  // -------------------------------------------------------------
  // Test A: Flowchart Parsing & Validation
  // -------------------------------------------------------------
  console.log('• A. Flowchart Diagram (User Request -> Router -> AI -> Renderer)');
  const flowchartCode = `
flowchart TD
    UserRequest([User Input]) --> Validation{Validate Request}
    Validation -->|Valid| Router[Intelligent Router]
    Validation -->|Invalid| ErrorNotice[Return User Error]
    Router -->|RAG| SearchTool[Search & Citations Tool]
    Router -->|Direct| AIProvider[Multi-Provider LLM]
    SearchTool --> AIProvider
    AIProvider --> ResponseRenderer[Response Markdown Renderer]
    ResponseRenderer --> FinalAnswer([Visual Answer Delivered])
  `.trim();

  const flowchartDetection = detectDiagramType(flowchartCode);
  assert(flowchartDetection !== null && flowchartDetection.type === 'flowchart', 'Correctly detects flowchart diagram type');
  assert(isMermaidLanguage('mermaid'), 'Identifies "mermaid" as Mermaid language');
  assert(!isMermaidLanguage('javascript'), 'Rejects "javascript" as Mermaid language');
  assert(isMermaidBlock('mermaid', flowchartCode), 'Explicit mermaid language routes to MermaidBlock');
  assert(isMermaidBlock('', flowchartCode), 'Untagged code block with flowchart TD routes to MermaidBlock');

  const flowchartValidation = await validateMermaidSyntax(flowchartCode);
  assert(flowchartValidation.valid === true, 'Flowchart parses with valid syntax');

  // -------------------------------------------------------------
  // Test B: Sequence Diagram (Streaming & Provider Failure)
  // -------------------------------------------------------------
  console.log('\n• B. Sequence Diagram (User, Frontend, Backend, AI Provider, DB)');
  const sequenceCode = `
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Ruhi Client
    participant Backend as Next.js API
    participant AI as Gemini/Claude LLM
    participant DB as MongoDB

    User->>Frontend: Send Query
    Frontend->>Backend: SSE Stream Request
    Backend->>DB: Fetch Active Conversation
    DB-->>Backend: Context Loaded
    Backend->>AI: Stream Completion
    alt Success Case
        AI-->>Backend: SSE Token Chunks
        Backend-->>Frontend: Stream Chunks
        Frontend-->>User: Render Typewriter
    else Provider Failure
        AI-->>Backend: 503 Provider Outage
        Backend->>AI: Fallback to Secondary Model
        AI-->>Backend: Fallback Response
        Backend-->>Frontend: Recovered Stream
    end
  `.trim();

  const seqDetection = detectDiagramType(sequenceCode);
  assert(seqDetection !== null && seqDetection.type === 'sequenceDiagram', 'Correctly detects sequence diagram type');
  const seqValidation = await validateMermaidSyntax(sequenceCode);
  assert(seqValidation.valid === true, 'Sequence diagram parses with valid syntax');

  // -------------------------------------------------------------
  // Test C: Additional Supported Diagram Types (Class, State, ER, Gantt, Pie, Timeline)
  // -------------------------------------------------------------
  console.log('\n• C. Additional Standard Diagram Types');

  const classCode = `
classDiagram
    class User {
        +String id
        +String name
        +Preferences preferences
        +login()
    }
    class Conversation {
        +String id
        +List~Message~ messages
        +addMessage()
    }
    User "1" --> "*" Conversation : owns
  `.trim();
  assert((await validateMermaidSyntax(classCode)).valid === true, 'Class diagram parses with valid syntax');

  const stateCode = `
stateDiagram-v2
    [*] --> Idle
    Idle --> Generating : User Prompt
    Generating --> Streaming : First Chunk
    Streaming --> Completed : EOF
    Streaming --> Error : Network Drop
    Error --> Idle : Retry
    Completed --> [*]
  `.trim();
  assert((await validateMermaidSyntax(stateCode)).valid === true, 'State diagram (v2) parses with valid syntax');

  const erCode = `
erDiagram
    USER ||--o{ CONVERSATION : has
    CONVERSATION ||--|{ MESSAGE : contains
    MESSAGE ||--o{ CITATION : cites
  `.trim();
  assert((await validateMermaidSyntax(erCode)).valid === true, 'Entity-Relationship diagram parses with valid syntax');

  const ganttCode = `
gantt
    title Ruhi AI Release Timeline
    dateFormat YYYY-MM-DD
    section Core
    Mermaid Engine :active, 2026-10-14, 3d
    Theme Integration : 2026-10-15, 2d
  `.trim();
  assert((await validateMermaidSyntax(ganttCode)).valid === true, 'Gantt chart parses with valid syntax');

  const pieCode = `
pie title AI Provider Utilization
    "Gemini 2.5 Flash" : 55
    "Claude 3.7 Sonnet" : 30
    "GPT-4o" : 15
  `.trim();
  assert((await validateMermaidSyntax(pieCode)).valid === true, 'Pie chart parses with valid syntax');

  const timelineCode = `
timeline
    title Ruhi AI Evolution
    2025 : Core Agent Launch
    2026 : Multimodal Workspace : Real-time Mermaid Rendering
  `.trim();
  assert((await validateMermaidSyntax(timelineCode)).valid === true, 'Timeline diagram parses with valid syntax');

  // -------------------------------------------------------------
  // Test D: Multiple Diagrams Isolation
  // -------------------------------------------------------------
  console.log('\n• D. Multiple Diagrams Independent Isolation');
  const d1 = `flowchart LR\n A --> B`;
  const d2 = `flowchart TD\n C --> D`;
  const [val1, val2] = await Promise.all([
    validateMermaidSyntax(d1),
    validateMermaidSyntax(d2),
  ]);
  assert(val1.valid === true && val2.valid === true, 'Multiple distinct diagrams validate concurrently without state collision');

  // -------------------------------------------------------------
  // Test E: Code Protection (Never Misclassify Regular Code as Mermaid)
  // -------------------------------------------------------------
  console.log('\n• E. Code Block Protection (Case G)');

  const jsArrowCode = `
const calculateDiscount = (price, rate) => {
  const discount = price * (rate / 100);
  return price - discount;
};
// graph -> not a diagram
const graph = { nodes: [], edges: [] };
  `.trim();
  assert(isExplicitCodeLanguage('javascript'), 'Identifies "javascript" as an explicit code language');
  assert(isExplicitCodeLanguage('js'), 'Identifies "js" as an explicit code language');
  assert(isExplicitCodeLanguage('typescript'), 'Identifies "typescript" as an explicit code language');
  assert(!isMermaidBlock('javascript', jsArrowCode), 'JavaScript with arrow functions is NEVER routed to Mermaid');
  assert(!isMermaidBlock('js', jsArrowCode), 'JS with arrow functions is NEVER routed to Mermaid');

  const pythonCode = `
def build_network():
    graph = {"A": ["B", "C"]}
    for node, edges in graph.items():
        print(f"{node} -> {edges}")
    return graph
  `.trim();
  assert(isExplicitCodeLanguage('python'), 'Identifies "python" as an explicit code language');
  assert(isExplicitCodeLanguage('py'), 'Identifies "py" as an explicit code language');
  assert(!isMermaidBlock('python', pythonCode), 'Python code with arrows and graph keyword is NEVER routed to Mermaid');

  const bashCode = `
curl -X POST https://api.example.com/v1/chat \\
  -H "Authorization: Bearer $KEY" \\
  -d '{"prompt": "Hello"}' -> output.log
  `.trim();
  assert(!isMermaidBlock('bash', bashCode), 'Bash script with redirection arrow is NEVER routed to Mermaid');

  // -------------------------------------------------------------
  // Test F: Streaming Resilience & Incomplete Syntax
  // -------------------------------------------------------------
  console.log('\n• F. Streaming Incomplete Syntax Handling (Case E)');
  const incompleteCode1 = `flowchart TD\n    A[User Request] -->`;
  const incompleteValidation = await validateMermaidSyntax(incompleteCode1);
  assert(incompleteValidation.valid === false, 'Incomplete syntax correctly flagged as invalid during token buffering');

  // -------------------------------------------------------------
  // Test G: Invalid Syntax Graceful Recovery (Case F)
  // -------------------------------------------------------------
  console.log('\n• G. Invalid Syntax Graceful Recovery');
  const brokenCode = `flowchart TD\n    A -->>> !! @@ ## BrokenNode`;
  const brokenValidation = await validateMermaidSyntax(brokenCode);
  assert(brokenValidation.valid === false, 'Invalid Mermaid syntax correctly captured with error description');
  assert(typeof brokenValidation.error === 'string', 'Error message provided for user feedback and source-view toggle');

  // -------------------------------------------------------------
  // Test H: Clean Source Unwrapping
  // -------------------------------------------------------------
  console.log('\n• H. Source Sanitization & Fence Unwrapping');
  const nestedWrapped = '```mermaid\nflowchart TD\n A --> B\n```';
  const unwrapped = cleanMermaidSource(nestedWrapped);
  assert(unwrapped === 'flowchart TD\n A --> B', 'Correctly unwraps nested fences from model responses');

  // -------------------------------------------------------------
  // Test I: Theme Configuration & Emerald Color Tokens
  // -------------------------------------------------------------
  console.log('\n• I. Theme Configurations & Contrast Safeguards (Case I)');
  const darkCfg = getMermaidThemeConfig('dark');
  assert(darkCfg.securityLevel === 'strict', 'Dark theme enforces securityLevel: strict');
  assert(darkCfg.themeVariables.darkMode === true, 'Dark theme enables darkMode');
  assert(darkCfg.themeVariables.lineColor === '#34d399', 'Dark theme uses bright emerald for line visibility');
  assert(darkCfg.themeVariables.primaryTextColor === '#f8fafc', 'Dark theme maintains high text contrast');

  const lightCfg = getMermaidThemeConfig('light');
  assert(lightCfg.securityLevel === 'strict', 'Light theme enforces securityLevel: strict');
  assert(lightCfg.themeVariables.darkMode === false, 'Light theme sets darkMode: false');
  assert(lightCfg.themeVariables.lineColor === '#059669', 'Light theme uses dark emerald for line visibility');
  assert(lightCfg.themeVariables.primaryTextColor === '#064e3b', 'Light theme maintains dark high contrast text');

  // -------------------------------------------------------------
  // Final Results
  // -------------------------------------------------------------
  console.log('\n=================================================================');
  console.log(`MERMAID VERIFICATION RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('=================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runMermaidSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
