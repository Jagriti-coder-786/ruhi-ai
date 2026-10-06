# 🌸 RUHI AI — Enterprise-Grade Multi-Provider AI Platform

> **Think, create, learn, and get things done with your intelligent AI companion.**

Ruhi AI is a modern, production-ready AI assistant platform engineered from scratch. It is not a toy chatbot wrapper—it is a full-featured, scalable platform featuring **multi-AI provider routing**, **persistent MongoDB memory**, **private RAG document intelligence**, **real-time streaming**, **verified web research**, **neural voice/vision**, **Razorpay subscriptions**, and a dedicated **Admin Dashboard**.

---

## 🌟 Architecture Highlights

```
                          ┌───────────────────────────┐
                          │   Ruhi AI Web Interface   │
                          │ Next.js App Router / React│
                          └─────────────┬─────────────┘
                                        │
                         HTTP/SSE REST & Streaming
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │       AI Router           │
                          │   (Tier & Task Gating)    │
                          └─────────────┬─────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│    Gemini Provider   │    │   OpenAI Provider    │    │  Anthropic / Grok /  │
│  (Primary Default)   │    │  (GPT-4o / Mini)     │    │  OpenRouter Providers│
└──────────┬───────────┘    └──────────────────────┘    └──────────────────────┘
           │
           ├────────────────────────────┬────────────────────────────┐
           ▼                            ▼                            ▼
┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
│  Document RAG Engine │    │  Tools Framework     │    │ Persistent Memory    │
│  Chunking & Cosine   │    │  Web Search, Math,   │    │ MongoDB User Scoped  │
│  Embeddings          │    │  DateTime, Weather   │    │ Preferences          │
└──────────────────────┘    └──────────────────────┘    └──────────────────────┘
```

- **Multi-AI Provider Abstraction**: Common `AIProvider` interface decoupled from specific vendors. Native Google Gemini 2.5 Flash & Pro out-of-the-box, with architectural support for OpenAI, Anthropic Claude, xAI Grok, and OpenRouter.
- **Dynamic Model Registry & Router**: Evaluates tasks (multimodal vision, deep reasoning, speed), user subscription tiers (Free vs Pro/Team), and handles automatic failover.
- **Document Intelligence (RAG)**: Full pipeline supporting PDFs, Word (`.docx`), CSVs, spreadsheets, Markdown, and JSON. Overlapping semantic text chunker, 768-dim embeddings, vector cosine similarity matching, and prompt injection defense boundaries.
- **Persistent Lifelong Memory**: Non-sensitive user preferences and facts stored in MongoDB, automatically injected into system prompts, with complete user editing controls.
- **Tools Framework**: Autonomous web research with live citations, safe mathematical engine, clock/timezones, weather forecasts, and neural image generation.
- **Razorpay Subscription Gateway**: Native Indian payment integration supporting UPI, Net Banking, and Cards. Cryptographic HMAC-SHA256 signature verification with automated tier activation and graceful developer sandbox fallback.
- **Admin Control Console**: Real-time metrics (users, ARR, messages, tokens), AI provider health checks, user plan assignments, and audit logging.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19, TypeScript)
- **Styling**: Tailwind CSS v4, custom CSS variables, Obsidian Dark theme, glassmorphic accents
- **Database**: MongoDB Atlas / Local MongoDB with Mongoose (separate message docs, compound indexes, strict user data isolation)
- **AI Primary**: Google Gemini API (`gemini-2.5-flash`, `gemini-2.5-pro`, `text-embedding-004`)
- **Authentication**: JWT HTTP-only secure cookie session with bcrypt password hashing
- **Payments**: Razorpay Node.js SDK with cryptographic HMAC-SHA256 signature verification
- **Testing**: Native automated test suite (`npx tsx tests/run-tests.ts`)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ or v20+ (v25 supported)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI.

### 2. Installation

Clone or navigate to the project directory:
```bash
cd "Ruhi AI"
npm install
```

### 3. Environment Configuration

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_key_here

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/ruhi_ai

# Primary AI Provider (Google Gemini API)
# Get your free key at https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key

# Optional Additional AI Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
XAI_API_KEY=
OPENROUTER_API_KEY=

# Payments & Subscriptions (Razorpay)
# Get keys at https://dashboard.razorpay.com/
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Optional Web Search
TAVILY_API_KEY=
```

> **Note**: Even without a live `GEMINI_API_KEY`, Ruhi AI will run smoothly in intelligent simulated assistant mode so you can test all UI, RAG, memory, and database features immediately. When a key is provided, real-time Gemini streaming is activated automatically!

---

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Instant Exploration Mode
On the Login or Signup screen, click **"Launch Instant Demo (Pro Access)"** to instantly log in with pre-seeded projects, memory preferences, and full Pro privileges!

### Production Build
```bash
npm run build
npm run start
```

---

## 🧪 Automated Testing

Ruhi AI comes with a comprehensive automated test suite covering all 9 architectural domains:
```bash
npm test
```

### Test Coverage:
1. **Model Registry**: Validates multi-provider registration and tier isolation.
2. **AI Router**: Tests automated fallback, image-based vision routing, and tier enforcement.
3. **Semantic Chunker**: Tests boundary preservation and overlapping window splits.
4. **Vector Math**: Tests identical and orthogonal cosine similarity formulas.
5. **Prompt Injection Defense**: Validates external untrusted data boundaries.
6. **Safe Calculator**: Verifies mathematical evaluation and ensures malicious code injection is safely blocked.
7. **Razorpay Signature**: Verifies HMAC-SHA256 signature validation and sandbox simulation.
8. **Usage & Quotas**: Checks daily request limits and Reasoner model gating.
9. **JWT Security**: Tests token signing and session payload extraction.

---

## 📁 Project Structure

```
d:/Ruhi AI/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/             # Metrics & user moderation
│   │   │   ├── auth/              # Signup, login, logout, me, demo
│   │   │   ├── chat/              # Flagship SSE streaming chat endpoint
│   │   │   ├── conversations/     # Chat history persistence & deletion
│   │   │   ├── documents/         # File uploads, text extraction, RAG
│   │   │   ├── images/            # Neural image generation studio
│   │   │   ├── memory/            # User memory CRUD
│   │   │   ├── messages/          # Granular message documents
│   │   │   ├── models/            # Dynamic model registry endpoint
│   │   │   ├── projects/          # Workspace management
│   │   │   ├── search/            # Global multi-entity search
│   │   │   ├── subscriptions/     # Razorpay orders and HMAC verification
│   │   │   └── usage/             # Rate limit inspection
│   │   ├── auth/                  # Branded login & signup pages
│   │   ├── chat/                  # Full chat application workspace
│   │   ├── projects/              # Projects hub
│   │   ├── settings/              # User settings & memory controls
│   │   ├── admin/                 # Admin console
│   │   ├── globals.css            # Design system tokens & themes
│   │   ├── layout.tsx             # Root layout with AuthProvider
│   │   └── page.tsx               # High-impact landing page
│   ├── components/
│   │   ├── chat/                  # ChatArea, CodeBlock, MarkdownRenderer
│   │   ├── modals/                # UpgradeModal, SearchModal
│   │   ├── sidebar/               # Collapsible Sidebar & history
│   │   └── voice/                 # Web Speech voice interface
│   ├── config/
│   │   └── env.ts                 # Central typed environment config
│   ├── hooks/
│   │   └── useAuth.tsx            # Client session context hook
│   ├── lib/
│   │   ├── auth/                  # JWT signing & session helpers
│   │   └── db/                    # Cached Mongoose connection
│   ├── models/                    # Mongoose schemas (User, Conversation, Message, etc.)
│   ├── providers/ai/              # Multi-AI abstraction (Gemini, OpenAI, Anthropic, Router)
│   ├── services/
│   │   ├── image/                 # Image generation service
│   │   ├── memory.ts              # Memory injection & management
│   │   ├── projects.ts            # Project context service
│   │   ├── rag/                   # Parser, chunker, retriever, sanitizer
│   │   ├── razorpay.ts            # Payment order & signature verification
│   │   ├── tools/                 # Web search, calculator, clock, weather
│   │   └── usage.ts               # Quota and rate tracking
│   └── types/                     # Shared TypeScript interfaces
├── tests/
│   └── run-tests.ts               # Comprehensive automated test suite
├── package.json
└── README.md
```

---

## 🔒 Security Principles

1. **User Data Isolation**: Every database query is strictly scoped to the authenticated user ID (`{ _id: resourceId, userId: authenticatedUserId }`). Users can never inspect or retrieve another user's conversations, files, or memories.
2. **Prompt Injection Defense**: Retrieved document chunks and external search snippets are sanitized and wrapped in `<UNTRUSTED_RETRIEVED_KNOWLEDGE>` boundaries with explicit system defense instructions.
3. **Server-Side Plan Gating**: Model availability, message quotas, and context sizes are validated strictly on the server before invoking models.
4. **Cryptographic Payment Verification**: Razorpay payment signatures are validated using server-side HMAC-SHA256 calculations.
5. **Admin Route Protection**: Admin dashboard and endpoints enforce `role === 'admin'` server-side with structured audit logs.

---

## 🚢 Deployment

### Deploying on Vercel
1. Push your repository to GitHub / GitLab.
2. Import project into [Vercel](https://vercel.com).
3. Set environment variables (`MONGODB_URI`, `GEMINI_API_KEY`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
4. Click **Deploy**. Next.js App Router and serverless routes will deploy automatically.

### MongoDB Atlas Setup
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and whitelist your network or `0.0.0.0/0`.
3. Set `MONGODB_URI` to your connection string (e.g. `mongodb+srv://<user>:<password>@cluster0.mongodb.net/ruhi_ai?retryWrites=true&w=majority`).

---

## 📄 License
MIT License © 2026 Ruhi AI Engineering Team.
