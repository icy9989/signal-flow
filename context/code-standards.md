# Code Standards

## General

* Keep modules small, focused, and single-purpose.
* Prefer clear, explicit code over clever abstractions.
* Fix root causes instead of layering workarounds.
* Do not mix unrelated concerns in the same component, route, service, or module.
* Preserve the architectural boundaries defined in `architecture.md`.
* Do not introduce new patterns when an existing project pattern already solves the problem.
* Avoid premature abstraction.
* Do not refactor unrelated files while implementing a feature.
* Prefer composition over large reusable components with many configuration flags.
* Keep business rules centralized instead of duplicating them across pages or routes.
* Do not silently catch and ignore errors.
* Do not leave temporary debugging code, commented-out implementations, or unused code in completed work.
* New code must remain understandable without requiring knowledge of hidden assumptions.
* All feature work must respect tenant isolation.
* AI-generated data must never automatically become trusted application data.
* Deterministic application logic remains authoritative for analytics, permissions, billing, usage, and workflow state.

---

# TypeScript

## Strictness

TypeScript strict mode is required throughout the project.

Do not weaken compiler settings to make errors disappear.

Avoid:

```ts
any
```

Prefer:

```ts
unknown
```

for external or untrusted values, then narrow them using validation.

Use explicit types when the type communicates domain meaning.

Example:

```ts
type OrganizationId = string;
type ProjectId = string;
```

Do not create aliases merely for stylistic purposes when they provide no additional meaning.

---

## Type Inference

Allow TypeScript to infer simple local values.

Good:

```ts
const count = feedback.length;
```

Avoid unnecessary annotation:

```ts
const count: number = feedback.length;
```

Explicitly type:

* Public function boundaries
* Shared interfaces
* Service inputs
* Service outputs where useful
* API payloads
* AI schemas
* Domain models
* Complex data structures

---

## No Unsafe Assertions

Avoid:

```ts
value as SomeType
```

when the value came from:

* API requests
* AI responses
* CSV files
* Environment variables
* Webhooks
* External integrations
* JSON parsing

Validate unknown data before trusting it.

Prefer:

```ts
const result = schema.safeParse(input);

if (!result.success) {
  // handle validation failure
}

const data = result.data;
```

Type assertions are acceptable only when the application can prove the type through another trusted invariant.

---

## Null and Undefined

Handle nullable values explicitly.

Avoid unsafe non-null assertions:

```ts
value!
```

unless the invariant guaranteeing the value is extremely clear.

Prefer guards:

```ts
if (!project) {
  throw new NotFoundError("Project not found");
}
```

---

## Enums and Constants

Use enums or narrow string unions for stable domain states.

Example:

```ts
type ProcessingStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";
```

Prefer database enums when values represent persisted workflow states.

Do not scatter magic strings throughout the codebase.

---

# Naming Conventions

Use names that describe business meaning.

Prefer:

```ts
organizationId
feedbackAnalysis
getFeedbackByProject
calculateTopicGrowth
```

Avoid:

```ts
data
item
obj
temp
handler2
resultData
```

unless the meaning is obvious from very small local scope.

---

## Booleans

Boolean names should read naturally.

Prefer:

```ts
isLoading
isMember
hasAccess
canManageBilling
shouldRetry
```

Avoid:

```ts
loading
member
access
billing
```

when those variables represent booleans.

---

## Functions

Functions should generally use verbs.

Examples:

```ts
createOrganization()
validateCsvRows()
calculateGrowthRate()
generateFeedbackEmbedding()
authorizeOrganizationAccess()
```

Queries should use names such as:

```ts
getFeedback()
findOrganization()
listTopics()
```

---

## Components

React component names use PascalCase:

```text
FeedbackTable
MetricCard
TopicDetail
InsightCard
```

Files containing a primary React component should use the project's established file naming convention consistently.

Do not mix naming conventions arbitrarily.

---

# Functions

Prefer small functions with one primary responsibility.

A function should not:

1. Authenticate the user
2. Parse CSV
3. Insert feedback
4. Call the AI provider
5. Generate embeddings
6. Recalculate analytics

Break such behavior into services and jobs.

Use early returns to reduce nesting.

Prefer:

```ts
if (!user) {
  throw new AuthenticationError();
}

if (!membership) {
  throw new AuthorizationError();
}

return performOperation();
```

over deeply nested branches.

---

# Next.js

## App Router

Use the Next.js App Router.

Routes and layouts belong under:

```text
src/app/
```

Use route groups where they improve organization without affecting URL structure.

Example:

```text
app/
├── (auth)/
└── (dashboard)/
```

---

## Server Components

Server Components are the default.

Use Server Components for:

* Initial database-backed page data
* Authentication-aware layouts
* Dashboard page composition
* Feedback lists
* Topic pages
* Settings pages
* Server-rendered metadata

Do not add `"use client"` to a page simply because one nested component is interactive.

Keep client boundaries narrow.

---

## Client Components

Use Client Components when browser behavior is actually required.

Examples:

* Interactive charts
* File upload interactions
* Dialogs
* Dropdowns
* Command palette
* Client-side filtering controls
* Drag and drop
* Optimistic UI
* Local transient state

Do not fetch privileged application data directly from client components when a Server Component or trusted API boundary is more appropriate.

---

## Server Actions

Use Server Actions for mutations when they provide a clean implementation and match the feature boundary.

Every Server Action must:

1. Authenticate
2. Authorize
3. Validate input
4. Call application/service logic
5. Return a predictable result

Do not place large business workflows directly inside Server Actions.

---

## Route Handlers

Route handlers should remain thin transport boundaries.

They should:

```text
Request
   ↓
Authenticate
   ↓
Authorize
   ↓
Validate
   ↓
Call Service
   ↓
Normalize Response
```

They should not:

* Contain large database workflows
* Contain model prompts
* Perform long-running AI processing
* Reimplement authorization rules
* Calculate complicated analytics inline

---

# React

## Component Responsibility

A component should primarily own presentation and UI interaction.

Avoid components that simultaneously handle:

* Database access
* Authorization
* AI calls
* Analytics calculations
* Billing
* Complex business rules

Move these responsibilities to server-side modules.

---

## Props

Keep component props minimal and intentional.

Prefer:

```ts
interface TopicCardProps {
  name: string;
  feedbackCount: number;
  growthRate: number;
}
```

instead of passing large database records when most fields are unused.

---

## State

Do not store server state redundantly in local React state unless the UI requires temporary editing or optimistic behavior.

Avoid duplicating values that can be derived from existing state.

Prefer:

```ts
const filteredCount = feedback.filter(...).length;
```

instead of maintaining a separate synchronized `filteredCount` state.

---

## Effects

Do not use `useEffect` as the default solution for data flow.

Use it only for genuine external synchronization or browser-side effects.

Avoid effects that simply copy one state value into another.

---

# Styling

SignalFlow is dark-mode first.

Use the design system consistently.

---

## Design Tokens

Use CSS variables or Tailwind theme tokens for recurring visual values.

Prefer:

```css
var(--background)
var(--foreground)
var(--border)
var(--muted)
var(--accent)
```

over scattered hardcoded colors.

Avoid arbitrary hex values throughout components.

---

## Dark Mode

The default application aesthetic should use:

* Near-black background
* Slightly lighter cards/panels
* Subtle borders
* High-contrast text
* Muted secondary text
* Restrained accent usage

Do not rely on excessive gradients or glow effects to communicate AI features.

The product should look like a professional analytics SaaS, not a generic AI landing page.

---

## Tailwind

Use Tailwind utilities for standard styling.

Avoid extremely long repeated class strings.

Extract repeated product-level patterns into reusable components.

Do not create abstractions around one-off styling unless repetition justifies it.

---

## Responsive Design

All primary application screens must support:

* Desktop
* Tablet
* Reasonable mobile layouts

The analytics experience may prioritize desktop, but essential navigation and data access must remain usable on smaller screens.

---

## Accessibility

Use semantic HTML.

Interactive controls must be keyboard accessible.

Provide labels for form controls.

Maintain sufficient contrast.

Do not communicate states such as severity or sentiment using color alone.

Charts should have accessible labels or adjacent textual representations for important information.

---

# shadcn/ui

Treat `components/ui/*` as presentation primitives.

Prefer composing them into product components.

Example:

```text
components/ui/card.tsx
        ↓
components/dashboard/metric-card.tsx
```

Do not put SignalFlow-specific database, AI, authorization, or analytics logic inside generated shadcn components.

Avoid modifying generated primitives unless necessary.

---

# API Routes

All API input is untrusted.

Validate request data before business logic executes.

Use Zod or another established project schema.

---

## Authentication

Protected endpoints must explicitly resolve the authenticated user.

Never use user IDs supplied by the browser as proof of identity.

---

## Authorization

For tenant-owned resources, verify:

```text
Authenticated User
      ↓
Organization Membership
      ↓
Required Permission
      ↓
Organization-Owned Resource
```

before reading or mutating private data.

---

## Response Shape

Return predictable response structures.

For success, use a consistent convention such as:

```json
{
  "data": {}
}
```

For expected errors, use a consistent convention such as:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The uploaded CSV is invalid."
  }
}
```

Do not leak internal error details to clients.

---

## HTTP Semantics

Use appropriate status codes.

Examples:

```text
200 — Successful request
201 — Resource created
400 — Invalid input
401 — Not authenticated
403 — Not authorized
404 — Resource unavailable / not found
409 — State conflict
429 — Rate or usage limit exceeded
500 — Unexpected internal failure
```

Do not expose whether a cross-tenant resource exists when doing so would leak information.

---

# Validation

Validate data at system boundaries.

Boundaries include:

* Forms
* Route handlers
* Server Actions
* CSV uploads
* Webhooks
* AI responses
* Environment variables
* External integrations

Internal functions may rely on already validated values when the boundary is explicit.

Do not repeatedly validate identical data at every internal function call without reason.

---

# Multi-Tenant Code Standards

Tenant isolation is mandatory.

Tenant-owned queries must include organization context.

Avoid:

```ts
await prisma.feedback.findUnique({
  where: {
    id: feedbackId,
  },
});
```

for user-facing tenant operations.

Prefer a query logically equivalent to:

```ts
await prisma.feedback.findFirst({
  where: {
    id: feedbackId,
    organizationId,
  },
});
```

Every tenant-owned service should receive trusted organization context.

Do not accept authorization context directly from untrusted client payloads.

---

## Repository Signatures

Prefer:

```ts
getFeedback({
  organizationId,
  feedbackId,
});
```

instead of:

```ts
getFeedback(feedbackId);
```

when handling tenant-owned data.

This makes organization scope visible in the function contract.

---

# Prisma and Database Standards

## Prisma Client

Use one shared Prisma client implementation.

Do not instantiate new Prisma clients throughout the application.

---

## Queries

Select only data required by the calling layer when practical.

Avoid loading large relationships by default.

Use explicit:

```ts
select
```

or narrowly scoped:

```ts
include
```

for complex queries.

---

## Transactions

Use transactions when multiple database operations must succeed or fail together.

Good examples:

* Create organization + owner membership
* Atomic import-state changes
* Related records that must stay consistent

Do not keep a transaction open while waiting for an AI provider, billing provider, or other network service.

---

## Migrations

Schema changes must use the project's Prisma migration workflow.

Do not manually modify an already-applied production migration.

Do not use destructive schema changes casually.

Review tenant relationships and cascade behavior before introducing deletions.

---

## Raw SQL

Prefer Prisma for normal application access.

Raw SQL is acceptable when:

* pgvector requires it
* Advanced aggregation requires it
* Prisma cannot express an efficient operation cleanly

Raw SQL must:

* Use parameterization
* Preserve tenant scoping
* Be documented when non-obvious

Never build SQL queries through untrusted string concatenation.

---

# Data and Storage

PostgreSQL is the source of truth for product state.

Store in PostgreSQL:

* Users
* Organizations
* Memberships
* Projects
* Feedback
* Feedback analysis
* Topics
* Insights
* Imports
* Usage metadata
* Subscription metadata
* Embedding vectors

---

## Original Feedback

Preserve source feedback separately from AI-generated analysis.

Never overwrite:

```text
Feedback.content
```

with:

```text
AI summary
```

Keep source and interpretation separate.

---

## Files

Do not store large binary files directly in database rows.

For the initial CSV workflow:

* Parse uploads server-side
* Store normalized feedback in PostgreSQL
* Retain original files only if product requirements explicitly require it

Use blob/object storage if persistent original files are introduced later.

---

# AI Code Standards

All AI access belongs behind:

```text
server/ai/
```

Do not import provider SDKs randomly throughout the application.

---

## Structured Outputs

Prefer structured output for machine-consumed AI behavior.

Example schema:

```ts
const FeedbackAnalysisSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "negative"]),
  category: z.string(),
  topic: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  summary: z.string(),
});
```

Provider responses must be validated.

Do not trust successful HTTP responses as proof of valid model output.

---

## AI Responsibilities

AI may:

* Understand natural language
* Classify feedback
* Interpret sentiment
* Suggest topic labels
* Generate embeddings
* Summarize evidence
* Explain verified analytics

AI must not own:

* Authorization
* Permissions
* Billing
* Usage limits
* Feedback counts
* Percentages
* Growth calculations
* Statistical thresholds
* Workflow completion state

---

## Numeric Claims

Never allow the model to calculate authoritative product statistics from raw text.

Correct:

```ts
const stats = calculateTopicStats(data);

const summary = await explainTopic({
  feedbackCount: stats.feedbackCount,
  growthRate: stats.growthRate,
});
```

Incorrect:

```ts
const summary = await model.generate(`
  Read these feedback messages and determine
  the percentage increase in complaints.
`);
```

Application code calculates facts.

AI explains facts.

---

## Prompt Organization

Store prompts in dedicated AI modules.

Example:

```text
server/ai/prompts/
├── feedback-classification.ts
├── topic-summary.ts
└── insight-generation.ts
```

Do not scatter large inline prompts throughout route handlers.

---

## Prompt Inputs

Provide only necessary data.

Do not send:

* Authentication tokens
* Billing credentials
* Unrelated customer records
* Entire datasets when a narrow subset is enough

Minimize sensitive data sent to external AI services.

---

## Model Configuration

Centralize model configuration.

Do not hardcode model names across many files.

Prefer:

```text
config/ai.ts
```

or the defined provider configuration layer.

---

# Embeddings

Embedding generation belongs behind the AI abstraction.

Store:

* Vector
* Model identifier
* Source feedback relationship
* Relevant version metadata when needed

Do not assume vectors produced by different embedding models are interchangeable.

If the embedding model changes materially, define a re-embedding strategy.

---

# Semantic Search

Every vector search must include tenant scope.

Semantic search should not bypass normal access control.

Use metadata/database filters for exact constraints such as:

* Organization
* Project
* Date
* Sentiment
* Source

Use vector similarity for meaning-based matching.

---

# Background Jobs

Long-running operations must run outside normal request handlers.

Examples:

* AI classification
* Embedding generation
* Large imports
* Topic recalculation
* Insight generation

---

## Job Design

Jobs should receive stable identifiers rather than huge payloads when possible.

Prefer:

```ts
{
  feedbackId,
  organizationId
}
```

over placing the complete feedback database record in the queue.

Workers should load authoritative current state from the database.

---

## Job States

Use explicit job or processing state.

Example:

```text
PENDING
PROCESSING
COMPLETED
FAILED
```

Never mark processing complete before dependent persistence succeeds.

---

## Idempotency

Retries must not accidentally:

* Duplicate feedback
* Double-count usage
* Create repeated topic relationships
* Produce uncontrolled duplicate insights

Use unique constraints, upserts, or idempotency keys where appropriate.

---

# Analytics

Analytics code belongs in deterministic application logic.

Functions should make calculations explicit.

Examples:

```ts
calculateFeedbackVolume()
calculateSentimentDistribution()
calculateGrowthRate()
calculateTopicTrend()
detectEmergingIssue()
```

Do not hide important metric formulas inside UI components.

---

## Percentages

Protect against division-by-zero and missing baselines.

A growth function must define expected behavior when:

```text
previous period = 0
current period = 0
data is incomplete
```

Do not invent a percentage when the mathematical result is undefined.

---

## Dates

Use consistent timezone handling.

Store timestamps in a canonical database representation.

Apply user-facing formatting at presentation boundaries.

Do not mix formatted date strings with authoritative stored timestamps.

---

# Error Handling

Use typed or well-defined application errors.

Examples:

```text
AuthenticationError
AuthorizationError
ValidationError
NotFoundError
ConflictError
RateLimitError
AIProviderError
ImportError
```

Do not inspect arbitrary error message strings throughout the application to determine error type.

---

## Error Messages

User-facing messages should explain what the user can understand or fix.

Internal logs should carry technical diagnostic information.

Do not expose:

* Stack traces
* Database queries
* AI provider credentials
* Environment variables
* Internal prompts

---

# Logging

Use structured logs instead of scattered:

```ts
console.log(...)
```

in production logic.

Useful context may include:

```text
requestId
organizationId
projectId
feedbackId
importId
jobId
operation
duration
status
```

Do not log secrets.

Avoid logging complete customer feedback unless required for a clearly defined diagnostic reason.

---

# Security

Never commit secrets.

Keep server credentials in environment variables.

Examples:

```text
DATABASE_URL
AI_API_KEY
AUTH_SECRET
QUEUE_CONNECTION
BILLING_SECRET
WEBHOOK_SECRET
```

Only variables intentionally exposed to browser code may use the public environment prefix supported by the framework.

---

## Client Trust

Never trust values from the browser for:

* User identity
* Organization membership
* Role
* Subscription plan
* Remaining usage
* Billing status
* Resource ownership

Resolve these server-side.

---

# Forms

Use schema validation shared with the server where appropriate.

Client-side validation improves UX.

Server-side validation provides correctness.

Never rely exclusively on client-side validation.

---

# Loading, Empty, and Error States

Every significant data-driven interface should account for:

* Loading
* Empty
* Success
* Error

Examples include:

* Feedback inbox
* Topics
* Insights
* Dashboard charts
* Imports
* Search results

Do not show a blank dashboard when there is simply no data.

Use meaningful empty states that explain the next useful action.

---

# Tables

Large datasets must use pagination or another bounded loading strategy.

Do not load every feedback record into the browser for normal list views.

Filtering and sorting over large datasets should run server-side.

---

# Charts

Charts visualize computed analytics.

Charts must not independently calculate conflicting versions of business metrics.

Prepare normalized chart data on a trusted application boundary when practical.

Use tooltips and labels consistently.

Do not rely solely on color to distinguish critical states.

---

# Testing

Prioritize tests around high-risk behavior.

Required areas include:

1. Organization isolation
2. Authorization
3. CSV validation
4. Feedback import behavior
5. AI schema validation
6. Analytics formulas
7. Background job state transitions
8. Usage enforcement
9. Important subscription rules

---

## AI Testing

Do not assert exact generated sentences unless exact wording is required.

Prefer verifying:

* Output matches schema
* Required fields exist
* Invalid output is rejected
* Numerical claims come from supplied verified data
* References point to valid feedback
* Correct tenant data is used

AI output is probabilistic.

Application invariants are not.

---

# Comments

Write comments to explain:

* Why a non-obvious decision exists
* Important invariants
* External-provider limitations
* Unusual performance decisions
* Security-sensitive logic

Avoid comments that simply repeat the code.

Bad:

```ts
// Increment count
count++;
```

Useful:

```ts
// Keep topic aggregation tenant-scoped even though topic IDs
// are globally unique to prevent authorization assumptions from
// leaking into analytics queries.
```

---

# TODO Comments

Do not use vague TODOs.

Avoid:

```ts
// TODO: fix this
```

Prefer:

```ts
// TODO(feedback-import): support configurable maximum CSV row count
// after upload limits are defined in product requirements.
```

Open product questions should also be reflected in `progress-tracker.md`.

---

# Imports

Use consistent import ordering according to the project's formatter/linter configuration.

Prefer path aliases for stable application-level imports.

Example:

```ts
import { prisma } from "@/server/db";
```

instead of deeply nested paths:

```ts
import { prisma } from "../../../../server/db";
```

Avoid circular dependencies between feature modules.

---

# File Organization

## `src/app/`

Routing, layouts, loading states, error boundaries, route handlers, and Server Action entry points.

Do not place substantial business logic here.

---

## `src/components/ui/`

Generic UI primitives.

No SignalFlow-specific business logic.

---

## `src/components/`

Reusable visual product components.

Examples:

```text
dashboard/
feedback/
topics/
insights/
layout/
shared/
```

---

## `src/features/`

Feature-specific application code.

Examples:

```text
auth/
organizations/
projects/
feedback/
imports/
topics/
insights/
analytics/
search/
usage/
billing/
```

Each feature may contain:

```text
components/
actions/
queries/
schemas/
types/
utils/
```

only when those folders are actually useful.

Do not create empty folder structures in advance.

---

## `src/server/auth/`

Authentication and authorization helpers.

---

## `src/server/db/`

Prisma client and database infrastructure.

---

## `src/server/repositories/`

Persistence and tenant-aware database access.

---

## `src/server/services/`

Business workflows coordinating repositories, permissions, queues, and analytics.

---

## `src/server/ai/`

AI provider integrations, prompts, schemas, embeddings, classifiers, and summaries.

---

## `src/server/jobs/`

Background job definitions and worker handlers.

---

## `src/server/queue/`

Queue infrastructure.

---

## `src/server/analytics/`

Authoritative product analytics calculations.

---

## `src/lib/`

Framework-independent shared utilities.

Do not turn `lib/` into a dumping ground.

If logic belongs to a domain feature, keep it within that feature.

---

## `src/types/`

Only truly shared types.

Feature-specific types should remain near their feature.

---

## `src/config/`

Application-level configuration.

Examples:

```text
AI configuration
navigation
feature flags
application constants
```

---

# Protected Files

Do not modify the following without an explicit need:

```text
components/ui/*
generated/*
node_modules/*
```

Do not manually edit third-party package internals.

Do not modify generated Prisma artifacts.

Treat already-applied migration files as immutable unless the documented migration workflow requires otherwise.

---

# Linting and Formatting

Code should pass the project's configured:

```bash
npm run lint
npm run build
```

and test commands when present.

Do not disable lint rules locally simply to silence legitimate errors.

If a rule conflicts with necessary architecture, address the underlying design or document why an exception is required.

---

# Performance

Optimize based on actual application behavior.

Important baseline rules:

* Paginate large feedback lists.
* Select only required database fields.
* Use appropriate database indexes.
* Batch inserts for large imports.
* Avoid sequential AI calls when safe bounded concurrency is appropriate.
* Do not send unnecessary data to Client Components.
* Do not recompute expensive analytics repeatedly without reason.
* Move slow work to background jobs.

Correctness takes priority over premature optimization.

---

# Dependency Rules

Add a dependency only when:

1. It solves a concrete requirement.
2. Existing project dependencies do not already solve it cleanly.
3. Its maintenance and runtime cost are acceptable.

Do not add multiple libraries that solve the same problem without a clear reason.

Do not replace established project libraries casually.

---

# Code Review Checklist

Before considering a feature complete, verify:

1. Does the code follow `architecture.md`?
2. Is tenant access explicitly enforced?
3. Is external input validated?
4. Are AI outputs validated?
5. Are analytics deterministic?
6. Is long-running work outside request handlers?
7. Are Server and Client Component boundaries appropriate?
8. Are errors handled intentionally?
9. Are loading and empty states covered?
10. Are secrets kept server-side?
11. Are important data queries bounded?
12. Are tests added for high-risk behavior?
13. Are context documents still accurate?
14. Does `npm run build` pass?

---

# Core Standard

When deciding where code belongs, follow this separation:

```text
UI
└── Presents state and captures user interaction

Routes / Actions
└── Authenticate, authorize, validate, delegate

Services
└── Own product workflows and business rules

Repositories
└── Own persistence

Analytics
└── Calculate authoritative metrics

AI
└── Interpret language and explain verified data

Jobs
└── Execute long-running work

Database
└── Own durable product state and evidence
```

Never collapse these responsibilities simply because putting everything in one file is faster.

SignalFlow should remain a maintainable SaaS application as it grows, not an AI demo held together by route handlers.
