# NexusAI — Multi-Agent Customer Support Platform

An AI-powered customer support system with a multi-agent architecture built using **Hono.dev**, **Next.js**, **Prisma**, and the **Vercel AI SDK** with **Groq**.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Sidebar  │  │ ChatInterface │  │     DebugPanel        │  │
│  │ (Convos) │  │   (SSE)      │  │  (Agent Traces)       │  │
│  └──────────┘  └──────────────┘  └───────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ /api/* (Hono via Next.js catch-all)
┌────────────────────────▼────────────────────────────────────┐
│                     Backend (Hono.dev)                        │
│  Middleware: Auth → Rate Limit → Logger → Error Handler      │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                   Router Agent (LLM)                  │    │
│  │         Classifies intent → routes to agent           │    │
│  └──────┬───────────────┬──────────────────┬────────────┘    │
│         │               │                  │                 │
│  ┌──────▼──────┐ ┌──────▼──────┐ ┌────────▼────────┐       │
│  │ Support     │ │   Order     │ │    Billing       │       │
│  │   Agent     │ │   Agent     │ │     Agent        │       │
│  │ - searchFAQ │ │ - getOrder  │ │ - getInvoice     │       │
│  │ - queryHist │ │ - delivery  │ │ - checkRefund    │       │
│  │             │ │ - cancel    │ │ - paymentHistory │       │
│  └─────────────┘ └─────────────┘ └──────────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  PostgreSQL (Prisma ORM)                      │
│  Users, Conversations, Messages, Orders, Payments, Invoices  │
│  FAQArticles, Agents, Tools, ConversationSummaries           │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Features

### Core
- **Multi-Agent Routing** — AI-powered router classifies user intent and dispatches to specialized agents
- **Streaming Responses (SSE)** — Real-time token-by-token streaming from agents
- **Tool Execution** — Agents call real database-backed tools (FAQ search, order lookup, payment history)
- **Conversation Persistence** — All messages and metadata stored in PostgreSQL
- **Context Compaction** — Automatic conversation summarization for long threads

### Bonus Features
- **Monorepo** — Turborepo with `apps/web`, `apps/api`, `packages/database`, `packages/shared`
- **Typing/Thinking Indicator** — Real-time agent status (analyzing, tool calls, composing)
- **Debug Panel** — Shows routing decisions, tool calls, and context compaction status
- **Rate Limiting** — Per-IP (60/min) + per-user (100/hour) with `Retry-After` headers
- **Context Summarization** — Older messages auto-summarized to fit context windows
- **Deploy-Ready** — Vercel config included, setup scripts provided

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL database (or use Supabase)

### Setup

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd swadesh-ai-task
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Initialize database:**
   ```bash
   pnpm --filter @repo/database exec prisma generate
   pnpm --filter @repo/database exec prisma db push
   pnpm --filter @repo/database exec prisma db seed
   ```

4. **Start development:**
   ```bash
   pnpm dev
   ```

5. **Open the app:**
   - Navigate to `http://localhost:3000`
   - Click **"Demo Login"** to sign in without Google OAuth
   - Or append `?testAuth=true` for test mode

## 📡 API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/health` | Health check (DB + AI status) |
| `POST` | `/api/chat` | Send message (SSE streaming) |
| `POST` | `/api/chat/messages` | Send message (alias) |
| `GET` | `/api/chat/conversations` | List user conversations |
| `GET` | `/api/chat/conversations/:id` | Get conversation + messages |
| `DELETE` | `/api/chat/conversations/:id` | Delete conversation |
| `GET` | `/api/agents` | List available agents |
| `GET` | `/api/agents/:type/capabilities` | Get agent capabilities/tools |

### SSE Event Types

```typescript
// Thinking/typing indicator
{ type: 'thinking', status: 'Analyzing your request...', agentType: 'order' }

// Text delta (streaming token)
{ type: 'text', content: 'Your order...' }

// Tool being called
{ type: 'tool-call', toolName: 'getOrderDetails', args: { orderNumber: 'ORD-1001' } }

// Tool result
{ type: 'tool-result', toolName: 'getOrderDetails', result: { found: true, ... } }

// Stream complete
{ type: 'done', conversationId: '...', agentType: 'order', debugTrace: {...}, toolCalls: [...] }

// Error
{ type: 'error', message: 'Stream error occurred' }
```

## 🏛️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TailwindCSS |
| Backend | Hono.dev (via Next.js catch-all route) |
| Database | PostgreSQL + Prisma ORM |
| AI | Vercel AI SDK + Groq (Llama 3.3 70B) |
| Auth | NextAuth.js (Google OAuth + Demo Login) |
| Monorepo | Turborepo + pnpm workspaces |

## 📁 Project Structure

```
swadesh-ai-task/
├── apps/
│   ├── api/                    # Hono backend
│   │   └── src/
│   │       ├── agents/         # Router, Support, Order, Billing agents
│   │       ├── controllers/    # Chat & Agent controllers
│   │       ├── middleware/     # Auth, rate-limit, error, logger
│   │       ├── services/       # Agent, Conversation, Tool services
│   │       └── lib/            # Database singleton
│   └── web/                    # Next.js frontend
│       └── src/
│           ├── app/            # Pages and API catch-all route
│           ├── components/     # Chat, Sidebar, Debug, Auth
│           └── lib/            # Auth config, utilities
├── packages/
│   ├── database/               # Prisma schema, seed, client
│   └── shared/                 # Shared types and validators
├── .env.example                # Environment template
├── setup.sh                    # Automated setup script
└── turbo.json                  # Turborepo config
```

## 🧪 Testing

Access the app in demo mode:
```
http://localhost:3000?testAuth=true
```

Try these queries to test all three agents:
- **Support**: "What is your return policy?"
- **Order**: "Where is my order ORD-1002?"
- **Billing**: "Show me invoice INV-2024-001"

## 🔐 Security

- Environment variables for all secrets (`.env.example` provided)
- JWT-based session strategy (no server-side session storage needed)
- Per-IP and per-user rate limiting
- CORS configured for allowed origins
- Content Security Policy headers

## 📋 Assignment Compliance

| Requirement | Status |
|------------|--------|
| Controller-Service Pattern | ✅ |
| Multi-Agent System (Router + 3 agents) | ✅ |
| Agents with Tools (DB-backed) | ✅ |
| Conversation Context Persistence | ✅ |
| RESTful API Endpoints | ✅ |
| Streaming Responses (SSE) | ✅ |
| Typing/Thinking Indicator | ✅ |
| `/api/chat/*` routes | ✅ |
| `/api/agents/*` routes | ✅ |
| `/api/health` route | ✅ |
| Hono.dev Backend | ✅ |
| React/Next.js Frontend | ✅ |
| PostgreSQL + Prisma | ✅ |
| Vercel AI SDK | ✅ |
| **Bonus: Monorepo** | ✅ |
| **Bonus: Streaming** | ✅ |
| **Bonus: Typing Indicator** | ✅ |
| **Bonus: Rate Limiting** | ✅ |
| **Bonus: Context Compaction** | ✅ |
| **Bonus: Agent Reasoning UI** | ✅ |
| **Bonus: Deploy-Ready** | ✅ |
