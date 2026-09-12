# Architecture Context

## Stack

| Layer               | Technology                                                             | Role                                                                                                              |
| ------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Framework           | Next.js + TypeScript                                                   | Primary application framework for UI, server rendering, routing, API endpoints, and server-side application logic |
| Rendering           | React Server Components                                                | Default rendering model for data-driven application pages                                                         |
| Client UI           | React Client Components                                                | Interactive controls, charts, filters, dialogs, uploads, and browser-only behavior                                |
| Styling             | Tailwind CSS                                                           | Application styling and responsive layouts                                                                        |
| UI Components       | shadcn/ui                                                              | Reusable accessible UI primitives                                                                                 |
| Database            | PostgreSQL                                                             | Primary relational database                                                                                       |
| ORM                 | Prisma                                                                 | Database schema, migrations, queries, and relational modeling                                                     |
| Vector Search       | pgvector                                                               | Feedback embeddings and semantic similarity search                                                                |
| Authentication      | Auth provider / session-based authentication                           | User identity and session management                                                                              |
| Validation          | Zod                                                                    | Validation for API input, forms, CSV data, environment configuration, and AI structured output                    |
| File Parsing        | Server-side CSV parser                                                 | Parse and validate uploaded feedback datasets                                                                     |
| AI Provider         | LLM API abstraction                                                    | Classification, summarization, topic interpretation, and insight generation                                       |
| Embeddings          | Embedding model through AI provider abstraction                        | Generate vector representations of feedback                                                                       |
| Background Jobs     | Queue + worker architecture                                            | Run AI analysis and other long-running tasks asynchronously                                                       |
| Cache / Queue Store | Redis-compatible service                                               | Queue state, rate limiting, caching, and short-lived coordination where required                                  |
| Charts              | Modern React charting library                                          | Dashboard analytics and time-series visualization                                                                 |
| Logging             | Structured server logging                                              | Debug application, AI, import, and background-processing failures                                                 |
| Deployment          | Vercel-compatible web deployment + separate worker runtime if required | Production hosting                                                                                                |
| Package Manager     | npm                                                                    | Dependency and script management                                                                                  |

---

# High-Level Architecture

SignalFlow is a multi-tenant AI feedback intelligence SaaS.

The system is divided into four major layers:

```text
┌─────────────────────────────────────────────────────────────┐
│                        Web Application                      │
│                                                             │
│   Next.js UI                                                │
│   Server Components                                         │
│   Client Components                                         │
│   Route Handlers / Server Actions                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                      │
│                                                             │
│   Authentication                                            │
│   Authorization                                             │
│   Organization / Project services                           │
│   Feedback services                                         │
│   Import services                                           │
│   Analytics services                                        │
│   Usage / Billing services                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
              ┌─────────┴──────────┐
              ▼                    ▼
┌───────────────────────┐  ┌───────────────────────────────┐
│      PostgreSQL       │  │      Background Workers       │
│                       │  │                               │
│ Relational data       │  │ AI classification             │
│ Tenant ownership      │  │ Embeddings                    │
│ Analytics data        │  │ Topic processing              │
│ pgvector embeddings   │  │ Insight generation            │
└───────────────────────┘  └───────────────┬───────────────┘
                                           │
                                           ▼
                                ┌──────────────────────┐
                                │     AI Providers     │
                                │                      │
                                │ LLM                  │
                                │ Embedding Model      │
                                └──────────────────────┘
```

The browser must never call AI providers, databases, queue systems, or other privileged services directly.

All privileged operations pass through trusted server-side boundaries.

---

# Application Architecture

Onboarding uses `/app/onboarding` outside the dashboard route group, under the shared authenticated `/app` layout. Its server resolver composes the existing membership and active-project resolution and a tenant/project-scoped completed-import existence query requiring persisted feedback. No onboarding flags or step cookies are stored. Overview sends incomplete setup to onboarding; project/workspace management remains accessible for selection and creation. The first-import step reuses the shared CSV preview and execution flow. Confirmation navigates to a persisted import result; completed onboarding navigates to `/app/feedback`, the project-scoped Feedback Inbox.

The application shell lives in `src/app/` and `src/components/`. `/app/*` is
protected through Clerk and local application-user resolution. The layout and
overview independently resolve verified organization memberships and project context. Users without
memberships see onboarding; active workspaces show their selected project or a project empty state.
`/app/projects` lists organization-owned projects; `/app/projects/new` allows owners/admins to create them.
Desktop and mobile selectors persist verified project selection and refresh the project overview.
`/app/workspaces/new` provides workspace creation. Other product navigation stays
disabled until its feature unit is implemented.

Use Next.js App Router.

Recommended structure:

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   │
│   ├── (dashboard)/
│   │   └── app/
│   │       ├── overview/
│   │       ├── feedback/
│   │       ├── topics/
│   │       ├── insights/
│   │       ├── analytics/
│   │       ├── imports/
│   │       ├── integrations/
│   │       ├── team/
│   │       ├── billing/
│   │       └── settings/
│   │
│   └── api/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── feedback/
│   ├── topics/
│   ├── insights/
│   ├── analytics/
│   └── shared/
│
├── features/
│   ├── auth/
│   ├── organizations/
│   ├── projects/
│   ├── feedback/
│   ├── imports/
│   ├── topics/
│   ├── insights/
│   ├── analytics/
│   ├── search/
│   ├── usage/
│   └── billing/
│
├── server/
│   ├── auth/
│   ├── db/
│   ├── services/
│   ├── repositories/
│   ├── ai/
│   ├── jobs/
│   ├── queue/
│   ├── analytics/
│   └── logging/
│
├── lib/
│   ├── validation/
│   ├── utils/
│   ├── errors/
│   └── constants/
│
├── types/
│
└── config/
```

The exact folder structure may evolve, but responsibilities must remain separated.

---

# System Boundaries

## `app/`

Owns:

* Routing
* Page composition
* Layouts
* Route handlers
* Server actions
* Loading states
* Error boundaries

`app/` should orchestrate application behavior but should not contain substantial business logic.

Avoid implementing complex database or AI logic directly inside pages.

---

## `components/ui/`

Owns:

* shadcn/ui generated primitives
* Generic presentation primitives

Examples:

```text
Button
Dialog
Input
Select
DropdownMenu
Table
Tabs
Tooltip
```

These components must not contain product-specific business logic.

Avoid modifying generated primitives unless explicitly necessary.

---

## `components/`

Owns reusable visual components.

Examples:

```text
MetricCard
TrendBadge
DashboardHeader
FeedbackTable
FeedbackFilters
TopicCard
InsightCard
EmptyState
LoadingState
ChartContainer
```

Components may receive product data through props but should not own database access.

---

## `features/`

Owns product-level feature behavior.

Each feature may contain:

```text
components/
actions/
queries/
schemas/
types/
utils/
```

Feature modules should represent product concepts rather than infrastructure concepts.

Examples:

```text
features/feedback
features/topics
features/imports
features/analytics
```

---

## `server/auth/`

Owns:

* Session resolution
* Current user lookup
* Organization membership checks
* Role checks
* Authorization helpers

No route should duplicate authorization logic manually when a reusable authorization helper exists.

---

## `server/db/`

Owns:

* Prisma client
* Database connection lifecycle
* Database utilities
* Transaction helpers

Application code should not instantiate Prisma clients independently.

---

## `server/repositories/`

Owns database access patterns.

Examples:

```text
feedbackRepository
topicRepository
organizationRepository
projectRepository
importRepository
```

Repositories are responsible for persistence.

They must not contain UI logic.

Tenant-aware repositories must require organization context.

---

## `server/services/`

Owns business logic.

Examples:

```text
createProject()
importFeedback()
getFeedbackInbox()
createOrganization()
generateTopicSummary()
```

Services coordinate:

* Authorization
* Validation
* Repositories
* Queue submission
* Analytics

Services should not depend on React.

---

## `server/ai/`

Owns all model interaction.

Recommended structure:

```text
server/ai/
├── providers/
├── prompts/
├── schemas/
├── classifiers/
├── embeddings/
├── summaries/
└── insights/
```

Responsibilities include:

* Model provider abstraction
* Prompt construction
* Structured-output schemas
* AI response validation
* Classification
* Embedding generation
* Summarization
* Insight explanation

AI provider SDK usage must not appear throughout unrelated application files.

All AI interaction should pass through this boundary.

---

## `server/jobs/`

Owns background job definitions and execution.

Examples:

```text
processFeedback
generateEmbedding
recalculateTopic
generateInsight
```

Jobs should be idempotent where practical.

Job execution must update explicit processing state.

---

## `server/queue/`

Owns queue infrastructure.

Responsibilities:

* Submit jobs
* Retry configuration
* Job identity
* Dead-letter or failed-state behavior
* Worker coordination

Application request handlers submit jobs.

They do not perform long-running AI work directly.

---

## `server/analytics/`

Owns deterministic analytics.

Examples:

```text
feedback counts
sentiment percentages
growth rates
historical comparisons
trend calculations
emerging-issue thresholds
```

The analytics layer does not ask the LLM to calculate authoritative product metrics.

---

## `lib/validation/`

Owns reusable validation.

Use Zod schemas for:

* Request input
* Forms
* CSV rows
* AI responses
* Environment configuration

---

# Server / Client Boundary

React Server Components are the default.

Use Client Components only when browser state or interactivity is required.

Good Client Component use cases:

* Charts
* Modals
* Drag and drop
* Upload interfaces
* Interactive filters
* Command menu
* Dropdown menus
* Local optimistic state

Avoid marking large page trees with:

```text
"use client"
```

just because one nested component requires browser interaction.

Keep client boundaries as small as practical.

---

# Request Flow

Standard request flow:

```text
Browser
   ↓
Route / Server Action
   ↓
Authentication
   ↓
Authorization
   ↓
Input Validation
   ↓
Service
   ↓
Repository
   ↓
PostgreSQL
```

Long-running request flow:

```text
Browser
   ↓
Server Action / Route Handler
   ↓
Authentication
   ↓
Authorization
   ↓
Validation
   ↓
Create Database Record
   ↓
Submit Background Job
   ↓
Return Response
```

Worker flow:

```text
Queue
   ↓
Worker
   ↓
Load Tenant Resource
   ↓
AI / Analytics Operation
   ↓
Validate Result
   ↓
Persist Result
   ↓
Update Job Status
```

---

# Storage Model

## PostgreSQL

PostgreSQL is the system of record.

Store:

* Users
* Organizations
* Memberships
* Projects
* Feedback
* Feedback analysis
* Topics
* Topic-feedback relationships
* Imports
* Insights
* Usage records
* Subscription metadata
* Job metadata where appropriate
* Embedding vectors

Do not treat the AI provider or queue as durable source-of-truth storage.

---

# Core Data Model

## User

Represents an authenticated application user.

Typical fields:

```text
id
externalAuthId
email
name
image
createdAt
updatedAt
```

---

## Organization

Primary tenant boundary.

```text
id
name
slug
createdAt
updatedAt
```

All tenant-owned resources must resolve to an organization.

---

## OrganizationMember

Connects users to organizations.

```text
id
organizationId
userId
role
createdAt
```

Role examples:

```text
OWNER
ADMIN
MEMBER
```

Unique constraint:

```text
organizationId + userId
```

---

## Project

Represents a product or feedback workspace.

```text
id
organizationId
name
description
createdAt
updatedAt
```

A project belongs to exactly one organization.

---

## Feedback

Stores the original source feedback.

```text
id
organizationId
projectId
importId
source
externalId
content
customerReference
occurredAt
createdAt
updatedAt
processingStatus
```

Original feedback content must remain distinct from AI-generated interpretation.

---

## FeedbackAnalysis

Stores structured AI output.

```text
id
organizationId
feedbackId
sentiment
category
topicLabel
severity
summary
model
schemaVersion
createdAt
updatedAt
```

Keep analysis separate from raw feedback so AI output can be reprocessed later without destroying the source record.

---

## FeedbackEmbedding

Stores semantic vector data if separated from `Feedback`.

```text
id
organizationId
feedbackId
embedding
model
createdAt
```

Vector queries must remain tenant-scoped.

---

## Topic

Represents an aggregated feedback theme.

```text
id
organizationId
projectId
name
slug
summary
status
createdAt
updatedAt
```

---

## TopicFeedback

Many-to-many relationship between topics and feedback.

```text
topicId
feedbackId
organizationId
confidence
createdAt
```

This enables source traceability from topic intelligence back to real feedback.

---

## Insight

Represents an AI-assisted product observation.

```text
id
organizationId
projectId
topicId
type
title
summary
severity
status
createdAt
updatedAt
```

An insight should reference the data or topic that supports it.

---

## Import

Represents one feedback import operation.

```text
id
organizationId
projectId
filename
status
totalRows
validRows
invalidRows
processedRows
createdAt
completedAt
```

---

## UsageRecord

Tracks metered SaaS usage.

```text
id
organizationId
metric
quantity
periodStart
periodEnd
createdAt
```

Examples:

```text
feedback_processed
ai_requests
embedding_requests
storage_bytes
```

---

## Subscription

Stores application-level billing state.

```text
id
organizationId
providerCustomerId
providerSubscriptionId
plan
status
currentPeriodStart
currentPeriodEnd
createdAt
updatedAt
```

Billing provider state must be verified server-side.

---

# Multi-Tenant Architecture

Organization is the primary tenant boundary.

Every tenant-owned record must either:

1. Include `organizationId` directly, or
2. Belong to another entity whose organization ownership is explicit and enforced.

Prefer explicit `organizationId` on high-risk or frequently queried tenant-owned records.

Example:

```text
Organization
   ├── Members
   ├── Projects
   │    ├── Feedback
   │    ├── Topics
   │    └── Insights
   ├── Imports
   ├── Usage
   └── Subscription
```

---

# Tenant Query Rule

Never retrieve sensitive tenant-owned data by global resource ID alone.

Avoid:

```text
feedback.findUnique({
  where: { id: feedbackId }
})
```

when handling a user request.

Prefer logically:

```text
feedback.findFirst({
  where: {
    id: feedbackId,
    organizationId
  }
})
```

The exact Prisma implementation may vary, but organization scope must be enforced.

---

# Auth and Access Model

## Organization workspace V1 decisions

- PostgreSQL `OrganizationMember` is the authority for tenant access; Clerk supplies authenticated identity. This feature does not use Clerk Organizations.
- Keep `/app/...` URLs. A server-managed `signalflow-workspace` cookie remembers the selected organization for 30 days (`HttpOnly`, `SameSite=Lax`, `/app` path, `Secure` in production). It is an untrusted preference revalidated on each server entry.
- Memberships are ordered by creation time and ID. Zero memberships show onboarding; otherwise use the selected accessible membership or the first valid membership. Workspace switches redirect to `/app/overview` and refresh the application layout.
- Workspace slugs are generated server-side and remain stable. Normalize names to lowercase ASCII hyphenated text, use `workspace` when no ASCII characters remain, and bound the slug base to 80 characters for index size. Retry unique conflicts with numeric suffixes, then a UUID suffix. Slugs never authorize access.
- Organization and initial OWNER membership use a single atomic Prisma nested write. Public service entry points authenticate independently; persistence helpers receive only server-resolved identity and explicit organization scope.
- Workspace names are required, trimmed, and limited to 100 characters (user-approved on 2026-09-11). Slug editing, renaming, deletion, ownership transfer and invitations remain deferred. Project creation is implemented separately under the V1 project decisions below.

## Database and Clerk identity foundation

- Prisma CLI and local verification scripts load environment files using `@next/env`, matching Next.js. `DATABASE_URL` is the runtime PostgreSQL connection; optional `DIRECT_URL` is used for migrations when the runtime connection is pooled.
- The Node.js server uses one shared Prisma 7 client with `@prisma/adapter-pg`, bounded connection timeouts, and a development singleton. Credentials and Prisma access remain server-only.
- Versioned SQL migrations initialize the schema, including the pgvector extension required by the existing embedding column. Generation runs before production builds.
- On authenticated application entry, `requireApplicationUser()` resolves identity from Clerk server authentication, fetches the current Clerk profile, and upserts the local user by `externalAuthId`. Request-local React caching deduplicates this work; no cross-user cache is used.
- Clerk remains the authority for identity and sessions. Email, name, and image are refreshed on application entry. Email is never used to link different Clerk identities; conflicting unique emails fail closed. A verified primary email is required by the current email-based application model.
- This is synchronous access-time synchronization, not a webhook mirror. Profile changes are refreshed on the next server entry; Clerk account deletion revokes access but does not automatically delete local records or their audit relationships. Deletion/retention workflows remain a later requirement.
- Future protected pages, actions, and APIs must call the authentication helper themselves and independently verify organization membership; a layout is not an authorization boundary for child operations.

Authentication establishes user identity.

Authorization establishes what that user may do.

These are separate concerns.

For every protected operation:

```text
1. Resolve authenticated user
2. Resolve organization
3. Verify organization membership
4. Verify role / permission
5. Scope requested resource to organization
6. Perform operation
```

Do not trust:

```text
organizationId
userId
role
subscriptionPlan
```

from client input.

Resolve trusted authorization context server-side.

---

# Role Model

## Owner

Can:

* Manage organization
* Manage members
* Manage billing
* Create and delete projects
* Import feedback
* Access analytics
* Manage integrations

---

## Admin

Can:

* Manage projects
* Import feedback
* View analytics
* Manage most product settings
* Invite or manage members if allowed by product policy

Cannot manage ownership transfer unless explicitly supported.

---

## Member

Can:

* View assigned organization data
* Browse feedback
* View topics
* View insights
* Use permitted search and analytics features

Mutation permissions should be defined explicitly per feature.

---

# AI Architecture

AI is an interpretation layer, not the source of truth.

## Single-feedback classification V1 decisions (2026-09-11)

- Feature 07 implements a server-only single-feedback service and read-only Inbox enrichment. No classification runs during imports, page reads, or HTTP requests; queue orchestration follows in the next feature.
- Classification uses the spec's three sentiments, eight categories, and four severity levels. Extend the existing database category enum additively; legacy COMPLAINT/PRAISE/QUESTION values remain stored but are not valid V1 output or reused as current analyses.
- Extend existing `FeedbackAnalysis` with `topics String[]` and nullable `promptVersion`; preserve legacy `topicLabel` without using it for new output. Project ownership follows `FeedbackAnalysis.feedback.projectId`; organization is copied only from the authorized source. One current analysis remains enforced by unique feedbackId.
- Contract bounds: 1–5 unique lowercase trimmed topics, each at most 80 characters; English summary at most 400 characters. Parse a bounded raw shape first (at most 20 candidate topics, 200 characters each, summary at most 2,000), then normalize, drop empty topics, deduplicate, take five, and strictly validate final bounds. Reject oversized individual labels/summaries rather than silently clipping meaning. Reject unchanged copies of source text longer than 200 characters.
- Empty source or source exceeding 20,000 characters fails before provider access; no source truncation. Source content is the only customer data supplied to the model.
- Mutating classification requires existing authenticated OWNER/ADMIN project access. Members retain read-only access. The service rechecks authorization after the provider returns, before saving output.
- Atomically claim non-PROCESSING feedback with its observed updatedAt; completion and one-analysis upsert share a short transaction. No transaction spans provider access. Conditional writes fence changes to the claimed source. PROCESSING returns a conflict; interrupted-process recovery belongs to the later background feature.
- Reuse only a complete, valid, normalized analysis with matching model, prompt and schema versions and COMPLETED feedback status. Explicit force, failed state, invalid/missing analysis or version mismatch allows reclassification. Failed reclassification preserves any prior analysis and original source; the UI labels prior output as previous analysis.
- Retry malformed output once with a static correction instruction, never raw validation errors. Provider/network/timeout/rate-limit failures return safe distinct codes for later retry; no hidden provider retry loop. Store the safe code on Feedback.analysisErrorCode; do not store raw provider output or log source text.
- Provider/model selection is pending; schema, prompt and persistence are provider-independent.

Main AI capabilities:

```text
Classification
Sentiment analysis
Topic extraction
Summarization
Embedding generation
Semantic similarity
Topic naming
Insight explanation
```

---

# AI Processing Pipeline

```text
Feedback
   ↓
Queued Job
   ↓
Worker
   ↓
Preprocess Input
   ↓
AI Classification
   ↓
Structured Output
   ↓
Schema Validation
   ↓
Persist FeedbackAnalysis
   ↓
Embedding Generation
   ↓
Persist Vector
   ↓
Topic Association
   ↓
Analytics Refresh
```

The exact order may evolve, but each stage should remain independently testable.

---

# AI Structured Output

AI output must conform to a versioned schema.

Example:

```text
FeedbackAnalysisSchema
├── sentiment
├── category
├── topic
├── severity
└── summary
```

Do not trust raw provider output.

Pipeline:

```text
Provider Response
      ↓
Parse
      ↓
Schema Validation
      ↓
Valid?
 ┌────┴────┐
 │         │
Yes        No
 │         │
Store    Retry / Fail
```

Malformed AI output must not silently become trusted application state.

---

# AI Provider Abstraction

Avoid coupling product logic directly to one provider.

Use an interface conceptually similar to:

```text
AIProvider
├── classifyFeedback()
├── generateEmbedding()
├── summarizeTopic()
└── generateInsight()
```

Provider-specific SDK code belongs inside:

```text
server/ai/providers/
```

This allows providers or models to change without rewriting feature logic.

---

# AI Prompt Management

Prompts should not be embedded randomly throughout the codebase.

Keep prompts close to their AI capability.

Example:

```text
server/ai/prompts/
├── feedback-classification.ts
├── topic-summary.ts
└── insight-generation.ts
```

Each prompt should define:

* Purpose
* Input
* Expected output
* Constraints
* Schema version where applicable

Prompt changes that affect stored structured data must be treated as application changes, not casual copy edits.

---

# Analytics Architecture

Analytics must be deterministic.

Examples:

```text
Total feedback
Feedback per day
Sentiment distribution
Topic volume
Growth percentage
Historical average
Source distribution
Issue threshold
```

These calculations belong in application code or database queries.

AI can explain calculated data.

AI does not generate authoritative metrics.

Correct:

```text
Database
   ↓
Analytics Service
   ↓
weeklyGrowth = 48%
   ↓
AI
   ↓
"Checkout complaints rose sharply this week."
```

Incorrect:

```text
Raw feedback
   ↓
AI
   ↓
"Checkout complaints increased 48%."
```

unless `48%` was independently calculated and supplied to the model.

---

# Emerging Issue Detection

Emerging issue detection is a deterministic analytics feature assisted by AI.

Recommended architecture:

```text
Topic Feedback
      ↓
Current Period Count
      ↓
Historical Baseline
      ↓
Growth / Deviation Calculation
      ↓
Threshold Check
      ↓
Emerging Issue Candidate
      ↓
AI Explanation
```

The application determines whether a statistical condition qualifies.

The AI explains the underlying feedback.

---

# Search Architecture

SignalFlow supports two different search modes.

## Structured Search

Use PostgreSQL for:

* Date filters
* Sentiment
* Category
* Source
* Severity
* Processing status
* Project
* Organization

---

## Semantic Search

Use pgvector for meaning-based search.

Example:

```text
"customers having trouble paying on mobile"
```

may match:

```text
"checkout freezes on my iPhone"
```

Semantic search flow:

```text
User Query
   ↓
Embedding
   ↓
Tenant-Scoped Vector Search
   ↓
Candidate Feedback
   ↓
Optional Metadata Filters
   ↓
Results
```

Tenant filtering is mandatory.

---

# CSV Import Architecture

## CSV preview V1 decisions (2026-09-11)

- Shared single-page preview at `/app/imports/new` and in the onboarding first-import step. File stays in component memory; no localStorage, raw-file retention, temporary database records, or persistence.
- Independently authenticated Server Actions parse the original upload for detection and reparse it for preview; only headers/counts return during detection. OWNER/ADMIN access follows existing import permissions. Membership and project ownership are verified for every request.
- Temporary engineering bounds: 512 KiB UTF-8 files, 5,000 data records, 100 columns, below the default Server Action body limit. These are preview capacity safeguards, not permanent product/plan limits. UI and server enforce the same bounds.
- Comma-delimited CSV supports BOM, CRLF/LF/CR, quoted multiline cells and escaped quotes; malformed quotes, blank/duplicate headers and inconsistent widths are rejected. Blank physical lines are ignored; delimiter-only records are validated. Source row numbers refer to the physical starting line.
- Mapping uses unique source columns, exact stable column keys and deterministic unambiguous suggestions. Optional blanks become null; internal content whitespace is preserved.
- Supported dates: `YYYY-MM-DD` at UTC midnight, or ISO timestamps with seconds and explicit `Z`/numeric timezone (optional 1–3 fractional digits). Invalid calendar dates and ambiguous/local dates are invalid rows.
- INVALID precedes DUPLICATE. First valid external ID occurrence is eligible; subsequent valid matches are duplicates. Invalid rows do not reserve IDs. Existing IDs use one organization/project-scoped query; no text-based deduplication.
- Preview uses 25-row pagination. Continue exposes a readiness summary; final confirmation reauthenticates and revalidates the original file with the canonical functions before insertion (execution decisions below).

CSV import is a separate pipeline from AI processing.

```text
Upload
   ↓
Parse
   ↓
Map Columns
   ↓
Validate Rows
   ↓
Preview
   ↓
User Confirmation
   ↓
Import
   ↓
Create Feedback Records
   ↓
Queue Processing Jobs
```

Do not call the AI model during initial CSV validation.

Import validation must be deterministic.

---

# Background Job Architecture

Long-running work belongs in workers.

Examples:

* AI classification
* Embedding generation
* Large imports
* Topic recalculation
* Insight generation
* Integration sync
* Analytics refresh where necessary

Request handlers should submit work and return.

---

# Job States

Use explicit processing states:

```text
PENDING
PROCESSING
COMPLETED
FAILED
```

Optionally:

```text
RETRYING
CANCELLED
```

Never represent a failed AI operation as completed.

---

# Retry Rules

Retries should apply primarily to transient failures such as:

* Provider timeout
* Rate limit
* Temporary network failure
* Worker interruption

Do not continuously retry:

* Invalid application data
* Unsupported input
* Permanently invalid schema
* Authorization failure

Retries must be bounded.

---

# Idempotency

Background jobs should be idempotent where practical.

Processing the same job twice must not:

* Duplicate feedback
* Double-count usage
* Create duplicate topic relationships
* Create multiple equivalent analysis records unintentionally

Use identifiers, unique constraints, job keys, or transaction logic where appropriate.

---

# Caching

Caching is optional and should be introduced only after correctness.

Good candidates:

* Repeated dashboard analytics
* Organization metadata
* Stable topic summaries
* Rate-limit state

Do not cache authorization decisions in ways that may allow stale access.

Database correctness takes priority over cache performance.

---

# Storage of Uploaded Files

For initial CSV imports:

* Raw upload may be processed transiently.
* Long-term storage is optional unless required by product scope.
* Parsed feedback belongs in PostgreSQL.

If raw-file retention is added later, use dedicated object/blob storage.

Do not store large file binaries inside relational database rows.

---

# API Architecture

API endpoints and server actions are transport boundaries.

They should:

```text
Authenticate
Authorize
Validate
Call service
Return normalized response
```

They should not:

```text
Contain large business workflows
Directly call AI providers
Perform long-running processing
Duplicate authorization logic
Expose raw internal errors
```

---

# Error Architecture

Use normalized application errors.

Suggested categories:

```text
AuthenticationError
AuthorizationError
ValidationError
NotFoundError
ConflictError
RateLimitError
AIProviderError
ImportError
InternalError
```

Browser responses should expose safe messages.

Server logs may contain technical details.

Do not expose:

* Stack traces
* SQL
* API keys
* Provider secrets
* Internal prompts
* Environment variables

---

# Logging

Use structured logging.

Useful context:

```text
requestId
userId
organizationId
projectId
feedbackId
importId
jobId
operation
duration
status
```

Do not unnecessarily log raw customer feedback.

Do not log secrets.

---

# Usage and Billing Architecture

Usage measurement must be deterministic.

Typical metrics:

```text
feedbackProcessed
aiRequests
embeddingRequests
storageUsage
teamMembers
```

Flow:

```text
Product Operation
      ↓
Verified Completion
      ↓
Usage Record
      ↓
Usage Aggregation
      ↓
Plan Enforcement
```

Do not ask the AI provider to determine usage entitlement.

Billing and AI are separate system boundaries.

---

# Plan Enforcement

Plan enforcement happens server-side.

Never rely only on disabling a button in the browser.

Example:

```text
Request Feedback Import
      ↓
Resolve Organization
      ↓
Resolve Subscription
      ↓
Check Usage Limit
      ↓
Allowed?
 ┌────┴────┐
 │         │
Yes        No
 │         │
Import   Reject
```

---

# Security Boundaries

Never expose:

* Database credentials
* AI provider secrets
* Queue credentials
* Billing secrets
* Webhook secrets
* Authentication secrets

Only explicitly public environment variables may be exposed to browser code.

---

# Data Deletion

Deletion behavior should be explicitly implemented.

Deleting an organization should eventually remove or archive:

```text
Projects
Feedback
Feedback analysis
Embeddings
Topics
Insights
Imports
Usage metadata
Integration credentials
```

Do not implement destructive cascading behavior casually.

Define and test deletion policy before enabling organization deletion.

---

# Performance Strategy

Do not optimize prematurely.

Initial performance priorities:

1. Pagination for feedback lists
2. Indexed tenant queries
3. Indexed project/date queries
4. Batch feedback inserts
5. Background AI processing
6. Avoiding unnecessary client JavaScript
7. Efficient dashboard aggregation
8. Vector indexes when dataset size justifies them

---

# Recommended Database Indexes

High-value indexes likely include:

```text
organizationId
projectId
createdAt
occurredAt
processingStatus
sentiment
category
source
```

Common compound indexes may include:

```text
organizationId + projectId
organizationId + projectId + createdAt
organizationId + processingStatus
organizationId + projectId + sentiment
```

Indexes should reflect actual query patterns rather than being added indiscriminately.

---

# Transaction Boundaries

Use database transactions when multiple writes must succeed together.

Examples:

* Organization + owner membership creation
* Confirmed import + import metadata updates
* Subscription state updates
* Operations that would leave inconsistent relationships if partially completed

Do not hold transactions open while calling external AI APIs.

Incorrect:

```text
BEGIN TRANSACTION
   ↓
Call AI Provider
   ↓
Wait 10 seconds
   ↓
Write
COMMIT
```

Instead:

```text
Prepare DB State
   ↓
Commit
   ↓
External Work
   ↓
New Short Transaction
```

---

# Observability

Important production workflows must be traceable.

At minimum, be able to determine:

```text
Did the import succeed?
Was feedback queued?
Did AI processing run?
Did validation fail?
Was an embedding created?
Was a topic associated?
Why did a job fail?
```

Background operations must not fail invisibly.

---

# Design Architecture

The product is dark-mode first.

Design principles:

```text
Near-black application background
Slightly elevated panels
Subtle borders
Restrained accent color
High information density
Clear typography
Minimal gradients
Minimal glow
Accessible contrast
Responsive dashboard layout
```

UI primitives remain generic.

Product-specific components live outside `components/ui`.

---

# Invariants

The following rules must never be violated.

## 1. Tenant Isolation

No user may read or mutate another organization's private data.

All tenant-owned queries must enforce organization ownership.

---

## 2. Authentication Is Not Authorization

A signed-in user is not automatically authorized to access an organization or resource.

Membership and permission checks are required.

---

## 3. AI Output Is Untrusted

All structured AI output must be validated before persistence or use.

---

## 4. AI Does Not Own Facts

AI must not be the authoritative source for:

* Counts
* Percentages
* Trends
* Dates
* Usage
* Billing
* Permissions
* Threshold decisions

---

## 5. Source Feedback Is Preserved

AI-generated analysis must never overwrite the original feedback content.

---

## 6. AI Insights Must Be Traceable

Important summaries and insights should resolve back to source feedback, topics, or verified analytics.

---

## 7. Long-Running Work Does Not Run in Request Handlers

AI processing, embedding generation, large imports, and similar tasks belong in background jobs.

---

## 8. Browser Code Never Holds Privileged Secrets

AI, database, queue, billing, and server credentials remain server-side.

---

## 9. Vector Search Is Tenant Scoped

Semantic search must apply the same organization isolation as ordinary database queries.

---

## 10. Analytics Are Deterministic

Dashboard numbers are computed from database data by application logic.

---

## 11. Billing Is Server Enforced

Subscription and usage limits are enforced on trusted server boundaries.

---

## 12. Background Jobs Have Explicit State

Jobs cannot silently disappear or report success after failure.

---

## 13. Database Is the Source of Truth

The queue, cache, browser, and AI provider are not authoritative stores of product state.

---

## 14. External Calls Do Not Hold Database Transactions Open

AI, billing, and integration requests occur outside long-running database transactions.

---

## 15. Server Components Are the Default

Use Client Components only where browser interactivity requires them.

---

## 16. UI Components Do Not Own Business Logic

Presentation components do not directly implement database, billing, AI, or authorization workflows.

---

## 17. Organization Scope Is Explicit

New tenant-owned models must define their ownership strategy before implementation.

---

## 18. AI Provider Details Stay Behind an Abstraction

Product features should not depend directly on one model vendor's SDK.

---

## 19. Imports and AI Processing Are Separate Pipelines

CSV validity does not depend on AI availability.

A user can successfully import valid feedback even when AI processing is temporarily unavailable.

---

## 20. Failed Processing Remains Visible

Failed AI or worker operations must be diagnosable and retryable rather than silently discarded.

---

# Core Architectural Principle

SignalFlow separates three responsibilities:

```text
AI
│
├── Understand language
├── Classify feedback
├── Detect semantic relationships
├── Summarize evidence
└── Explain insights


Application Code
│
├── Authentication
├── Authorization
├── Tenant isolation
├── Validation
├── Business rules
├── Analytics
├── Usage enforcement
├── Billing
└── Workflow state


Database
│
├── Source feedback
├── Ownership
├── Relationships
├── Structured analysis
├── Topics
├── Insights
├── Embeddings
├── Usage
└── Evidence
```

The architecture must preserve this separation.

**AI provides interpretation.**

**Application code provides correctness.**

**The database provides evidence and durable state.**

## Project Management — V1 decisions (2026-09-11)

- Project services independently verify local organization membership before any project query; repositories require organization scope. Project access returns trusted user, organization, membership, and project context.
- OWNER and ADMIN can create projects, following the product overview's management roles. MEMBER can list and select projects but cannot create them.
- Names and optional descriptions are trimmed; blank names are invalid. No permanent maximum lengths are introduced. Blank descriptions are stored as null. Existing database uniqueness is case-sensitive within an organization.
- Active project uses a revalidated HttpOnly, SameSite=Lax, production-Secure cookie scoped to `/app`, matching workspace selection. Routes remain `/app/overview` and `/app/projects`; project IDs are not route segments.
- Missing/stale/cross-workspace preferences fall back to the newest project (ID breaks timestamp ties). Empty workspaces remain empty until explicit creation. Switching workspace automatically revalidates project ownership.
- Creation, listing, and selection only: editing, deletion, archival, and import remain outside this feature. No schema migration is required.

## CSV execution and history V1 decisions (2026-09-11)

- Confirmation resubmits the original bounded CSV and mapping; the same canonical parser, row validation and duplicate classification run after fresh OWNER/ADMIN project authorization.
- Preview issues a random execution UUID without creating database records. Confirmation uses it as the existing FeedbackImport primary key. Atomic attempt creation and a conditional PENDING → PROCESSING claim prevent replay, including rows without external IDs. Retries return the same scoped persisted attempt; failed attempts are not rerun.
- Attempt metadata survives outside the feedback transaction. Feedback insertion and COMPLETED counters commit atomically. Failed transactions are recorded as FAILED with a safe execution message; process interruption may leave PROCESSING visible for investigation, without claiming success or offering unsafe reruns.
- Existing counters are sufficient: validRows means eligible rows after duplicate exclusion, invalidRows means invalid candidates, and duplicates = totalRows - invalidRows - validRows. On completion validRows = importedRows, including insert-time uniqueness skips. Failed attempts retain revalidation counters and importedRows = 0. No new schema fields or statuses are introduced. Timestamps are labeled Created/Updated, since no completedAt field exists.
- Optional blank source is persisted as "csv" because Feedback.source is required. Other optional metadata remains null. Raw files and rejected row contents are not retained; feedback processing starts PENDING without AI calls.
- Completed-with-zero records are allowed and shown as "No new feedback was imported"; only completed imports with associated persisted feedback complete onboarding.
- History shows the latest 50 imports for the authorized active project, newest first. Details require organization, project and import ID. The View feedback action opens the project-scoped Feedback Inbox described below.


## Feedback Inbox

- `/app/feedback` uses Server Components and explicit GET form submission for URL state (`q`, `source`, `importId`, `from`, `to`, `cursor`). `/app/feedback/[feedbackId]` shows full original text and scoped import metadata; its Back link preserves inbox state.
- Every service operation independently invokes the existing authenticated project-access boundary. Repository queries include organization and project scope, including counts, source options, import options, and import/detail lookups. Members may read; only owners/admins see the existing import CTA.
- Pages contain 25 items. The repository clamps internal page size to 1–50 and fetches one extra row. Keyset pagination orders by `createdAt DESC, id DESC` (newest imported first); nullable occurrence dates do not affect ordering. Validated opaque cursors contain the timestamp, ID, direction and a scope/filter fingerprint. A changed project/filter starts the first page; cursor contents never grant access.
- Keyword search uses case-insensitive literal substring matching on content, external ID and customer reference. LIKE wildcard characters are escaped. Source equality, scoped import ID, and inclusive UTC occurrence-date ranges compose with search. Missing occurrence dates do not match a date range.
- Query text is bounded to 500 characters as a request safeguard; malformed/duplicate parameters and invalid date ranges produce a clear-filter recovery state. Invalid or foreign import filters return the same unavailable message. No raw SQL, AI fields, content mutation, new dependencies or schema changes are introduced.
- UI truncates previews visually, renders imported content as plain text, labels UTC dates, and distinguishes an empty project from no matches. Source/import options come from actual scoped data. Queries are constant in number with no per-row metadata lookup. Existing scope/occurrence and project/source indexes remain; a created-time composite index and search-specific optimization can follow measured volume needs.
