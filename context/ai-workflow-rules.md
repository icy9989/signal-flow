# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven workflow.

The context files are the source of truth for what to build, how the system is structured, what behavior is expected, and what has already been completed.

Before implementing a feature:

1. Read the relevant context files.
2. Identify the smallest complete feature unit.
3. Confirm which system boundaries are affected.
4. Implement only that unit.
5. Verify it end to end.
6. Update the relevant documentation and `progress-tracker.md`.
7. Run validation and build checks before continuing.

Do not invent product behavior, database relationships, AI behavior, API contracts, or UI requirements that are not supported by the project context.

SignalFlow is a production-style, multi-tenant AI SaaS. Correctness, tenant isolation, AI reliability, and maintainability take priority over implementing features quickly.

---

# Scoping Rules

* Work on one feature unit at a time.
* Prefer small, verifiable increments over large speculative changes.
* Do not implement multiple unrelated features in one step.
* Do not refactor unrelated code while implementing a feature.
* Do not introduce abstractions before they are needed.
* Do not change architecture implicitly.
* Do not add dependencies without a concrete requirement.
* Preserve existing working behavior unless the specification explicitly changes it.

A feature unit should ideally be independently testable.

Examples of good feature units:

* Create organization
* Create project
* Upload CSV
* Preview CSV import
* Import validated feedback
* Display feedback inbox
* Process one feedback item
* Display sentiment analytics
* Display topic details

Avoid implementation requests such as:

> Build authentication, organizations, CSV imports, the AI pipeline, dashboard, billing, and analytics.

Split those into separate units.

---

# Recommended Implementation Order

Build the system in layers.

## Phase 1 — Application Foundation

Implement:

1. Application shell
2. Dark-mode design system
3. Authentication
4. Protected routes
5. Database connection
6. Base error handling

Verify that a user can authenticate and enter the protected application before continuing.

---

## Phase 2 — Multi-Tenant Foundation

Implement:

1. Organization model
2. Organization membership
3. Organization creation
4. Active organization selection
5. Organization-scoped authorization
6. Project creation

Tenant isolation must be verified before building features that store customer feedback.

Every tenant-owned resource must belong to an organization directly or through a clearly defined ownership chain.

Never trust an `organizationId` supplied by the client without verifying the current user's membership.

---

## Phase 3 — Feedback Import

Implement the CSV workflow incrementally:

1. File selection
2. CSV parsing
3. Column detection
4. Column mapping
5. Validation
6. Preview
7. Import confirmation
8. Database insertion
9. Import status
10. Import history

Do not connect AI processing to the upload flow until the basic import pipeline works reliably.

The first milestone is:

```text
CSV
 ↓
Parse
 ↓
Validate
 ↓
Preview
 ↓
Confirm
 ↓
Store Feedback
```

---

## Phase 4 — Feedback Inbox

Build the feedback browsing experience before advanced AI features.

Implement:

1. Feedback list
2. Pagination
3. Feedback detail
4. Date filtering
5. Source filtering
6. Processing-status filtering
7. Search
8. Empty/loading/error states

Verify that all queries respect organization and project boundaries.

---

# AI Development Rules

AI functionality must be introduced incrementally.

Do not build one large AI agent responsible for the entire feedback intelligence system.

Prefer narrow, structured AI operations with explicit inputs and outputs.

---

## Phase 5 — AI Classification

Start with one feedback item.

Input:

```text
Customer feedback
```

Expected structured output:

```json
{
  "sentiment": "negative",
  "category": "bug",
  "topic": "mobile_checkout",
  "severity": "high",
  "summary": "Checkout freezes after payment submission."
}
```

Define and validate the structured output schema before integrating the model.

The model response must never be written directly to trusted application state without validation.

The pipeline should follow:

```text
Feedback
   ↓
AI request
   ↓
Structured response
   ↓
Schema validation
   ↓
Validated analysis
   ↓
Database
```

Handle invalid model responses explicitly.

Do not silently convert malformed AI output into valid application data.

---

# AI Reliability Rules

AI-generated content is untrusted input.

Always validate structured AI responses before storing or using them.

AI may be used for:

* Feedback classification
* Sentiment interpretation
* Topic extraction
* Summarization
* Semantic similarity
* Topic naming
* Insight explanation

AI must not be the authoritative source for:

* Feedback counts
* Percentages
* Trend calculations
* Date calculations
* Usage limits
* Billing calculations
* Organization permissions
* Access control
* Subscription status
* Statistical thresholds

These values must come from deterministic application logic or stored data.

---

# Never Let AI Invent Analytics

A core product invariant is:

> AI interprets customer language. Application code calculates facts.

For example:

```text
Database
   ↓
143 checkout reports
89% negative sentiment
48% weekly increase
   ↓
Deterministic analytics
   ↓
AI receives those facts
   ↓
AI explains their meaning
```

The model may produce:

> Checkout complaints increased significantly this week and are predominantly negative.

The model must not independently claim:

> Checkout complaints increased by 48%.

unless `48%` was supplied to it from verified application calculations.

---

# Evidence Requirements

AI-generated topic summaries and insights should be traceable to actual feedback.

Whenever practical, maintain references between:

```text
Insight
   ↓
Topic
   ↓
Feedback
```

or:

```text
AI Summary
   ↓
Supporting Feedback IDs
```

Users should be able to inspect the original feedback behind important AI-generated conclusions.

Do not create AI-generated insights that cannot be connected back to source data.

---

# Phase 6 — Background Processing

AI processing must not block normal application requests.

Move AI processing into background jobs after single-feedback processing works correctly.

Pipeline:

```text
Feedback Imported
       ↓
Create Processing Job
       ↓
Queue
       ↓
Worker
       ↓
AI Classification
       ↓
Validate Output
       ↓
Persist Analysis
       ↓
Update Processing Status
```

Each job must have explicit states such as:

```text
pending
processing
completed
failed
```

Failed jobs must not appear as successfully processed.

Failures should be observable and retryable according to the architecture specification.

---

# Phase 7 — Dashboard Analytics

Build deterministic analytics before AI-generated insights.

Implement independently:

1. Total feedback
2. Feedback volume over time
3. Sentiment distribution
4. Category distribution
5. Topic counts
6. Source distribution
7. Date-range comparisons

Verify calculations against known test data.

Only after these calculations are correct should AI use them to produce explanations.

---

# Phase 8 — Topic Intelligence

Introduce topic intelligence incrementally.

Start with AI-extracted topics.

Then add:

1. Topic normalization
2. Topic aggregation
3. Topic detail pages
4. Related feedback
5. Topic trends

Only after these features work should semantic similarity or embedding-based clustering be introduced.

---

# Phase 9 — Embeddings and Semantic Search

Introduce embeddings as a separate system boundary.

Pipeline:

```text
Feedback
   ↓
Embedding Generation
   ↓
Vector Storage
   ↓
Similarity Search
   ↓
Relevant Feedback
```

Do not replace ordinary database filtering with vector search.

Use relational queries for structured filters such as:

* Organization
* Project
* Date
* Source
* Category
* Sentiment
* Status

Use vector search for semantic similarity.

All vector searches must still enforce tenant boundaries.

---

# Phase 10 — Emerging Issue Detection

Do not ask the LLM to decide whether an issue is trending based only on raw feedback.

Calculate trends deterministically.

Example:

```text
Current period
      ↓
Feedback count
      ↓
Historical baseline
      ↓
Growth calculation
      ↓
Threshold evaluation
      ↓
Emerging issue candidate
      ↓
AI explanation
```

Application code determines whether the configured threshold is satisfied.

AI explains the detected issue using the relevant feedback.

---

# Phase 11 — AI Insights

AI insight generation should consume verified data.

Example input:

```json
{
  "topic": "Mobile Checkout",
  "feedbackCount": 438,
  "weeklyGrowth": 82,
  "negativeSentiment": 91,
  "representativeFeedback": []
}
```

The AI can summarize why this topic may deserve attention.

Never allow the AI to replace the underlying analytics pipeline.

Every displayed numerical claim must originate from verified application data.

---

# Phase 12 — SaaS Features

Only after the core feedback intelligence workflow is stable should SaaS expansion continue.

Implement separately:

1. Team invitations
2. Roles and permissions
3. Usage tracking
4. Plan limits
5. Billing
6. Subscription lifecycle
7. Integrations

Billing must remain separate from AI processing logic.

---

# When to Split Work

Split an implementation step whenever it combines unrelated boundaries.

Examples:

### UI + Background Processing

Do not implement the dashboard UI and worker architecture in one unit.

Split into:

```text
1. Worker implementation
2. Worker verification
3. API/query layer
4. Dashboard UI
```

### Database + AI + Dashboard

Do not introduce a database schema, AI processing pipeline, and dashboard visualization simultaneously.

Implement and verify each boundary independently.

### Multiple API Routes

If multiple routes represent independent behavior, implement them separately.

### Authentication + Feature Logic

Authentication and authorization should already work before implementing organization-owned product features.

### AI Classification + Clustering

Classification and semantic clustering are separate AI capabilities.

Do not introduce them as one feature.

If a change cannot be verified end to end quickly, the scope is too broad.

Split it.

---

# Handling Missing Requirements

Do not invent product behavior that is not defined in the context files.

When something is ambiguous:

1. Stop implementation of the affected behavior.
2. Identify the missing decision.
3. Add it to `progress-tracker.md` as an open question.
4. Resolve the requirement in the appropriate context file.
5. Continue implementation after the requirement is defined.

Examples:

* Unknown organization role behavior
* Undefined CSV limits
* Undefined AI model behavior
* Missing retry policy
* Missing billing rule
* Undefined topic-merging behavior
* Unknown deletion behavior
* Missing data-retention policy

Do not choose arbitrary behavior simply to finish the feature.

---

# Multi-Tenant Safety Rules

Tenant isolation is a critical system invariant.

For every operation involving tenant-owned data:

1. Authenticate the user.
2. Resolve organization membership.
3. Verify required permission.
4. Scope the query to the organization.
5. Scope to the project where applicable.
6. Perform the operation.

Never query tenant-owned resources by resource ID alone when organization ownership can also be enforced.

Avoid:

```text
findFeedback(feedbackId)
```

Prefer logically:

```text
findFeedback({
  feedbackId,
  organizationId
})
```

Every new tenant-owned table must have an explicit ownership strategy documented in `architecture.md`.

---

# Data Integrity Rules

* Validate all external input.
* Validate uploaded CSV structure.
* Validate AI structured output.
* Validate API payloads.
* Enforce database constraints where appropriate.
* Use transactions for operations that must succeed atomically.
* Do not duplicate derived data without a defined reason.
* Do not silently swallow database errors.
* Do not silently ignore partial import failures.

---

# UI Development Rules

SignalFlow is a modern dark-mode-first SaaS dashboard.

UI work should maintain a consistent product language.

Prefer:

* Dark neutral surfaces
* Subtle borders
* Strong typography
* Restrained accent usage
* Compact dashboard layouts
* Consistent spacing
* Clear data hierarchy
* Accessible contrast
* Responsive layouts
* Skeleton loading states
* Useful empty states
* Clear error states
* Subtle transitions

Avoid:

* Excessive gradients
* Excessive glassmorphism
* Large glowing AI effects
* Inconsistent card styles
* Decorative animations that distract from analytics
* Unnecessary dashboard widgets

Every dashboard element should answer a product question.

Examples:

```text
How much feedback are we receiving?
What are customers talking about?
What is getting worse?
What are customers requesting?
What needs attention?
```

---

# Component Rules

Prefer reusable application components for repeated product patterns.

Examples:

```text
MetricCard
TrendBadge
FeedbackTable
FeedbackFilters
TopicCard
InsightCard
EmptyState
LoadingState
PageHeader
DateRangeSelector
ChartContainer
```

Do not prematurely generalize components that are used only once.

Generated UI library components should remain thin primitives rather than containing product-specific business logic.

---

# Protected Files

Do not modify generated or third-party internals unless explicitly instructed.

Protected areas include:

```text
components/ui/*
node_modules/*
generated/*
```

For `components/ui/*`, prefer composition or wrappers rather than modifying generated shadcn/ui primitives directly.

Also do not manually edit generated ORM migration artifacts after they have been applied unless the project's migration workflow explicitly requires it.

---

# API Rules

Every server-side operation must define:

* Input
* Validation
* Authentication requirements
* Authorization requirements
* Organization scope
* Success response
* Error behavior

Do not expose internal errors, stack traces, API keys, prompts, or provider responses to the browser.

Use consistent application error handling.

---

# Secrets

Never commit:

* AI provider API keys
* Database credentials
* Authentication secrets
* Billing secrets
* Webhook secrets
* Private integration credentials

Use environment variables and document required variables in the appropriate environment example file.

Never expose server-only secrets to client components.

---

# Logging

Log important system events with enough context to debug failures.

Useful fields include:

```text
requestId
organizationId
projectId
feedbackId
jobId
operation
duration
status
```

Never log:

* Passwords
* Authentication tokens
* API keys
* Payment credentials
* Entire sensitive customer-feedback payloads unnecessarily

---

# Testing Strategy

Tests should focus on high-risk product boundaries.

Prioritize tests for:

1. Tenant isolation
2. Authorization
3. CSV validation
4. Feedback imports
5. AI schema validation
6. Analytics calculations
7. Background job state transitions
8. Usage limits
9. Billing authorization

AI tests should not depend entirely on exact generated wording.

Test structured properties, schemas, grounding, and expected behavior instead.

---

# Keeping Documentation in Sync

Update the relevant context file whenever implementation changes:

* System architecture
* System boundaries
* Database/storage model
* AI pipeline
* Authorization strategy
* Coding conventions
* Feature scope
* Background processing
* External integrations

Do not allow the implementation and context files to describe different systems.

If implementation requires an architectural decision, document the decision before treating it as established architecture.

---

# Progress Tracking

After completing each feature unit, update `progress-tracker.md`.

Record:

```text
Feature:
Status:
Completed:
Files changed:
Verification:
Known issues:
Next unit:
```

Do not mark work complete simply because code was generated.

Completion means the feature has been implemented and verified within its defined scope.

---

# Before Moving to the Next Unit

Verify all of the following:

1. The current feature works end to end within its defined scope.
2. Authentication and authorization behavior remains correct.
3. Tenant isolation remains intact.
4. No invariant defined in `architecture.md` was violated.
5. Database migrations are valid.
6. AI outputs are validated where applicable.
7. Loading, empty, success, and error states are handled where applicable.
8. Relevant tests pass.
9. `progress-tracker.md` reflects the completed work.
10. Relevant context documentation is synchronized.
11. No secrets or sensitive data were introduced.
12. `npm run build` passes.

Do not proceed to the next feature while the current feature leaves the application in a broken state.

---

# Definition of Done

A feature is complete only when:

* Required behavior is implemented.
* UI behavior matches the specification.
* Server-side validation exists where required.
* Authorization is enforced.
* Tenant isolation is preserved.
* Error cases are handled.
* AI output is validated when AI is involved.
* Analytics use deterministic calculations where required.
* Supporting evidence is preserved for AI-generated insights where applicable.
* Relevant tests pass.
* Documentation is synchronized.
* `progress-tracker.md` is updated.
* Production build succeeds.

---

# Core Engineering Principle

SignalFlow should not be built as an LLM wrapper.

The system should combine:

```text
AI
├── Understand language
├── Classify feedback
├── Discover semantic relationships
├── Summarize evidence
└── Explain insights

Application Code
├── Authentication
├── Authorization
├── Tenant isolation
├── Data validation
├── Counts
├── Percentages
├── Trends
├── Thresholds
├── Billing
└── Business rules

Database
├── Source feedback
├── Structured analysis
├── Topics
├── Embeddings
├── Analytics data
└── Evidence relationships
```

AI provides interpretation.

Application code provides correctness.

The database provides evidence.

Keep these responsibilities separate throughout the implementation.
