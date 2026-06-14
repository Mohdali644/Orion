# Orion — Autonomous QA & GitHub Self-Healing Platform

<div align="center">
  
![Orion Banner](https://img.shields.io/badge/Orion-Autonomous%20QA%20%7C%20GitHub%20Self--Healing-0969DA?style=for-the-badge&logo=github&logoColor=white)

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5.101-FF4154?style=flat-square&logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.38-0055FF?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Axios](https://img.shields.io/badge/Axios-1.14-5A29E4?style=flat-square&logo=axios&logoColor=white)](https://axios-http.com/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

</div>


<br />

<p align="center">
  <b>Production-grade autonomous QA platform that crawls websites, orchestrates AI agents, produces composite quality scores, and integrates deeply with GitHub to enforce quality gates — blocking failing PRs and auto-creating fix pull requests.</b>
</p>

<br />

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Solution Architecture](#-solution-architecture)
- [System Design](#-system-design)
- [Design System](#-design-system)
- [Technical Architecture](#-technical-architecture)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Team](#-team)
- [License](#-license)

---

## 🔭 Overview

Orion is an autonomous quality assurance platform designed for modern engineering teams that ship fast and cannot afford quality regressions. It crawls any publicly accessible website, runs four specialized AI agents against every page, and produces a **composite 0–100 quality score** backed by granular findings.

When integrated with GitHub, Orion becomes a **self-healing CI/CD quality gate**: it automatically audits every push and pull request, posts status checks, blocks merges below configurable thresholds, and — for AI-resolvable issues — automatically creates fix PRs with suggested patches.

### Key Metrics

| Metric | Value |
|---|---|
| **Audit Time** | < 3 minutes for typical sites |
| **AI Agents** | 4 specialized agents (Discovery, Performance, Hygiene, Scoring) |
| **Score Range** | 0–100 with color-coded bands |
| **GitHub Integration** | OAuth App with status checks, PR blocking, auto-fix PRs |
| **API Endpoints** | 20+ RESTful endpoints |
| **Frontend Screens** | 8 fully-implemented pages |
| **Design System** | Custom Industrial Slate palette with glassmorphism |

---

## 🎯 Problem Statement

### The Challenge

Modern development teams deploy multiple times per day. Manual QA cannot keep pace. Existing tools are either:

- **Too slow** — Manual testing cycles take hours or days
- **Too narrow** — Performance-only or accessibility-only tools miss the full picture
- **Too disconnected** — Results live in separate dashboards, not in the developer workflow
- **Too passive** — They report problems but don't fix them

### The Impact

- **72%** of teams report shipping with known quality issues due to time pressure
- **3.5 hours/week** average developer time spent on manual QA per team member
- **40%** of production incidents originate from preventable regressions
- **PR review cycles** are extended by 2–4 hours when reviewers manually check for quality issues

### Orion's Solution

Orion addresses all four dimensions:

| Problem | Orion's Solution |
|---|---|
| **Too slow** | Automated audits complete in < 3 minutes |
| **Too narrow** | Four agents cover performance, accessibility, SEO, security, and best practices |
| **Too disconnected** | Results appear directly in GitHub PRs as status checks |
| **Too passive** | AI generates fix PRs for resolvable issues automatically |

---

## 🏗️ Solution Architecture

### High-Level Flow

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐
│   User/CI    │────▶│   Orion Engine   │────▶│   GitHub Status    │
│  (Paste URL  │     │  (Crawl + Score) │     │   Check Posted     │
│  or PR Push) │     │                  │     │   on PR            │
└──────────────┘     └──────────────────┘     └───────────────────┘
       │                      │                         │
       │                      ▼                         │
       │             ┌──────────────────┐               │
       │             │   4 AI Agents    │               │
       │             │  ┌────────────┐  │               │
       │             │  │ Discovery  │  │               │
       │             │  │ Performance│  │               │
       │             │  │ Hygiene    │  │               │
       │             │  │ Scoring    │  │               │
       │             │  └────────────┘  │               │
       │             └──────────────────┘               │
       │                      │                         │
       │                      ▼                         │
       │             ┌──────────────────┐               │
       │             │  Findings + Fix  │───────────────┘
       │             │  Suggestions     │
       │             └──────────────────┘
       │                      │
       ▼                      ▼
┌──────────────────────────────────────────────────────────┐
│                 GitHub Self-Healing                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │
│  │ Status Check   │  │ PR Blocked     │  │ Auto-Fix   │ │
│  │ (Pass/Fail)    │  │ (Below Score)  │  │ PR Created │ │
│  └────────────────┘  └────────────────┘  └────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### The Four AI Agents

Each agent is a specialized analyzer that contributes to the final score. Agents can be individually enabled or disabled per repository.

#### 1. Discovery Agent
```
Input: Target URL
Process: Crawls pages, follows internal links, maps site structure
Output: URL map, page count, orphan pages, broken links
Weight: 15% of final score
```

#### 2. Performance Agent
```
Input: Discovered URLs
Process: Lighthouse audits, Core Web Vitals measurement, resource analysis
Output: LCP, FID, CLS scores, render-blocking resources, image optimization gaps
Weight: 35% of final score
```

#### 3. Hygiene Agent
```
Input: Discovered URLs
Process: Accessibility tree analysis, WCAG compliance check, SEO meta audit, security header verification
Output: A11y violations, missing alt text, insecure headers, SEO gaps
Weight: 35% of final score
```

#### 4. Scoring Agent
```
Input: Aggregated findings from all agents
Process: Weighted scoring algorithm, severity classification, pass/fail determination
Output: 0–100 composite score, severity breakdown, pass/fail recommendation
Weight: 15% of final score (meta-agent)
```

### CI/CD Integration Flow

```
GitHub PR Opened / Push
        │
        ▼
GitHub Webhook → Orion Backend
        │
        ▼
Orion spawns audit against staging URL
        │
        ▼
4 agents execute in parallel
        │
        ▼
Scoring agent aggregates results
        │
        ▼
┌───────────────────────────────────┐
│ Score >= Threshold?               │
│  YES → Post ✅ status check       │
│  NO  → Post ❌ status check       │
│        + Block merge (optional)   │
│        + Create auto-fix PR       │
│          (if auto-fixable)        │
└───────────────────────────────────┘
```

---


## 🖥️ Technical Architecture

### Frontend Stack

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16.2 | React framework, App Router, SSR/SSG |
| **React** | 19.2 | UI library |
| **TypeScript** | 5.9 | Type safety |
| **Tailwind CSS** | 4.2 | Utility-first CSS, arbitrary values for design tokens |
| **TanStack Query** | 5.101 | Server state management, caching, refetching |
| **Framer Motion** | 12.38 | Declarative animations, spring physics |
| **Axios** | 1.14 | HTTP client with interceptors |
| **Lucide React** | 1.7 | Icon library (outline style) |
| **clsx + tailwind-merge** | — | Conditional class merging |


### Data Flow

```
User Action → React Component
     │
     ▼
useMutation / useQuery (TanStack Query)
     │
     ▼
API Client (Axios with interceptors)
     │
     ▼
HTTP Request → Backend API (/api/v1/*)
     │
     ▼
Response → Interceptor unwraps { success, data, error }
     │
     ▼
TanStack Query updates cache
     │
     ▼
React re-renders with new data
     │
     ▼
Framer Motion animates changes
```

### API Client Design

```typescript
// Interceptor pattern for consistent error handling
api.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse
    if (payload.success === false) {
      throw new ApiError(payload.error?.message, payload.error?.code, response.status)
    }
    return payload.data  // Auto-unwrap
  },
  (error: AxiosError<ApiResponse>) => {
    // Friendly error messages by status code
    if (status === 404) message = 'Resource not found.'
    else if (status === 401) message = 'Unauthorized.'
    else if (status >= 500) message = 'Server error.'
    else if (!error.response) message = 'Network error.'
    throw new ApiError(status, message, error)
  }
)
```

### Component Architecture

Each page is **self-contained** — all sub-components are defined in the same file to reduce fragmentation during rapid development.

```
app/
├── page.tsx              # Dashboard + ScoreArc, StatCard, MiniDonut, NavBar, Footer
├── runs/page.tsx         # All Runs + FilterBar, RunsTable, NewRunModal
├── runs/[runId]/page.tsx # Run Detail + ScoreRing, PipelineStepper, FindingList
├── repos/page.tsx        # Connected Repos + RepoCard, EmptyState, OnboardingSteps
├── repos/[repoId]/page.tsx # Repo Detail + SettingsModal, RunsTable
├── connect/callback/page.tsx # GitHub Callback + Stepper, StagingForm
├── settings/page.tsx     # Settings + Toggle, SettingsSection, DangerZone
├── docs/page.tsx         # Documentation + FaqItem, CodeBlock, ScoreGuide
└── notifications/page.tsx # Notifications + NotificationItem
```

---

## 📁 Project Structure

```
apps/web/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Root layout (fonts, providers)
│   │   ├── providers.tsx                 # QueryClientProvider
│   │   ├── globals.css                   # Tailwind directives
│   │   ├── page.tsx                      # → Dashboard (/)
│   │   ├── runs/
│   │   │   ├── page.tsx                  # → All Runs (/runs)
│   │   │   └── [runId]/
│   │   │       └── page.tsx              # → Run Detail (/runs/:id)
│   │   ├── repos/
│   │   │   ├── page.tsx                  # → Connected Repos (/repos)
│   │   │   └── [repoId]/
│   │   │       └── page.tsx              # → Repo Detail (/repos/:id)
│   │   ├── connect/
│   │   │   └── callback/
│   │   │       └── page.tsx              # → GitHub OAuth Callback
│   │   ├── settings/
│   │   │   └── page.tsx                  # → Settings (/settings)
│   │   ├── docs/
│   │   │   └── page.tsx                  # → Documentation (/docs)
│   │   └── notifications/
│   │       └── page.tsx                  # → Notifications (/notifications)
│   │
│   ├── components/
│   │   ├── Navbar.tsx                    # Global navigation (glass, notifications, ⌘K)
│   │   └── status/
│   │       ├── status-badge.tsx          # RunStatus badge component
│   │       └── score-ring.tsx            # ScoreRing SVG component
│   │
│   ├── lib/
│   │   ├── api.ts                        # Axios instance + API modules
│   │   ├── utils.ts                      # cn(), formatDate(), getScoreColor(), etc.
│   │   ├── types.ts                      # Shared TypeScript interfaces
│   │   └── hooks/
│   │       ├── index.ts                  # Barrel export
│   │       ├── useRuns.ts                # useQuery for runs list
│   │       ├── useRunDetail.ts           # useQuery for single run
│   │       ├── useRepos.ts               # useQuery for repos list
│   │       ├── useRepoDetail.ts          # useQuery for single repo
│   │       └── useMutations.ts           # useMutation hooks
│   │
│   └── types/
│       └── orion.ts                      # Core domain types (Run, Repo, Finding, etc.)
│
├── public/                               # Static assets
├── package.json                          # Dependencies & scripts
├── tsconfig.json                         # TypeScript configuration
├── tailwind.config.ts                    # Tailwind configuration
├── postcss.config.mjs                    # PostCSS configuration
└── next.config.ts                        # Next.js configuration
```

---

## 📡 API Reference

**Base URL:** `{NEXT_PUBLIC_API_URL}/api/v1`

All responses follow a standard envelope:

```typescript
interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    message: string
    code?: string
  }
}
```

Paginated responses extend with:

```typescript
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}
```

### Runs

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/runs` | Create audit run | `{ url: string }` | `Run` |
| `GET` | `/runs` | List runs (paginated) | Query: `?page=1&limit=10&status=running&mode=ci` | `PaginatedResponse<Run>` |
| `GET` | `/runs/:runId` | Get run with findings | — | `Run` (with `findings[]`, `pipelineStages[]`) |
| `POST` | `/runs/:runId/cancel` | Cancel running run | — | `Run` |
| `POST` | `/runs/:runId/rerun` | Re-run audit | — | `Run` |
| `GET` | `/runs/:runId/logs` | Stream live logs | — | SSE stream |
| `GET` | `/runs/:runId/compare` | Compare two runs | Query: `?with=:otherRunId` | `RunDiff` |

### Repositories

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| `GET` | `/repos` | List connected repos | — | `ConnectedRepo[]` |
| `POST` | `/repos` | Register from GitHub | `{ installationId, repositories[] }` | `ConnectedRepo[]` |
| `GET` | `/repos/:repoId` | Get repo detail | — | `RepoDetail` |
| `PATCH` | `/repos/:repoId` | Update config | `{ stagingUrl?, passThreshold?, autoFixEnabled?, ignoredPaths? }` | `ConnectedRepo` |
| `DELETE` | `/repos/:repoId` | Disconnect repo | — | `void` |
| `POST` | `/repos/:repoId/test` | Trigger test run | — | `Run` |

### Findings & Auto-Fix

| Method | Endpoint | Description | Request Body | Response |
|---|---|---|---|---|
| `GET` | `/findings/:findingId` | Get finding detail | — | `Finding` |
| `POST` | `/findings/:findingId/create-pr` | Create fix PR | `{ runId, repoId }` | `{ prUrl, prNumber, status }` |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/notifications` | List user notifications |
| `PATCH` | `/notifications/read-all` | Mark all as read |
| `PATCH` | `/notifications/:id/read` | Mark single as read |

### Statistics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/stats/dashboard` | Dashboard aggregate stats |
| `GET` | `/stats/repos` | Repository-level stats |

### GitHub

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/github/installation-status` | Check App installation status |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |

---

## 🚀 Getting Started

### Prerequisites

| Tool | Minimum Version | Purpose |
|---|---|---|
| **Node.js** | 18.x | Runtime |
| **pnpm** | 8.x | Package manager (recommended) |
| **Git** | 2.x | Version control |
| **GitHub App** | — | Required for CI integration features |

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/orion.git
cd orion

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration

# 4. Start development server
pnpm dev
```

The application will be available at **`http://localhost:3000`**.

### Environment Variables

```bash
# .env.local

# Required
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1    # Backend API base URL
NEXT_PUBLIC_GITHUB_APP_URL=https://github.com/apps/orion-qa/installations/new  # GitHub App install page

# Optional
NODE_ENV=development                                 # Environment mode
```

### Available Scripts

```bash
pnpm dev           # Start development server (port 3000)
pnpm build         # Production build
pnpm start         # Start production server
pnpm lint          # Run ESLint
pnpm check-types   # TypeScript type checking
```

### GitHub App Setup (for CI Integration)

1. Go to [GitHub Developer Settings](https://github.com/settings/apps)
2. Create a new GitHub App with these permissions:
   - **Repository contents**: Read-only
   - **Commit statuses**: Read & write
   - **Pull requests**: Read & write
   - **Webhooks**: Subscribe to `push` and `pull_request` events
3. Set the callback URL to `https://your-domain.com/connect/callback`
4. Generate a private key and configure it in your backend
5. Set `NEXT_PUBLIC_GITHUB_APP_URL` to your app's installation URL

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

Set environment variables in the Vercel dashboard:
- `NEXT_PUBLIC_API_URL` — Your backend URL
- `NEXT_PUBLIC_GITHUB_APP_URL` — Your GitHub App installation URL

### Docker

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t orion-frontend .
docker run -p 3000:3000 --env-file .env.local orion-frontend
```

---

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Make your changes following our conventions
4. Run type checking: `pnpm check-types`
5. Run linting: `pnpm lint`
6. Commit using conventional commits: `feat: add feature description`
7. Push and create a Pull Request

### Code Conventions

| Convention | Rule |
|---|---|
| **Components** | Inline within page files during rapid development; extract to `/components` when reused across pages |
| **Styling** | Tailwind CSS with arbitrary values for design tokens; no separate CSS files |
| **State** | TanStack Query for server state; React useState for UI state |
| **Types** | Explicit TypeScript interfaces; no `any` without justification |
| **Imports** | Absolute imports with `@/` alias; group: React → Next.js → Libraries → Local |
| **Commits** | [Conventional Commits](https://www.conventionalcommits.org/) format |

---



## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <br />
  <sub>Built with precision. Designed for production.</sub>
  <br />
  <br />
  <sub>
    <a href="https://nextjs.org">Next.js</a> ·
    <a href="https://react.dev">React 19</a> ·
    <a href="https://tailwindcss.com">Tailwind CSS v4</a> ·
    <a href="https://tanstack.com/query">TanStack Query</a> ·
    <a href="https://www.framer.com/motion/">Framer Motion</a> ·
    <a href="https://www.typescriptlang.org/">TypeScript</a>
  </sub>
</div>
