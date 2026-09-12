# CSV Import Execution and History

## Feature

Execute a previously validated CSV feedback import, persist eligible feedback records, record the import outcome, and provide users with a history of previous imports.

This feature begins after the CSV Import Preview feature has already:

```text
uploaded the CSV
      ↓
mapped columns
      ↓
normalized rows
      ↓
validated rows
      ↓
identified duplicates
      ↓
shown the preview
```

This feature completes the ingestion workflow:

```text
Confirm Import
      ↓
Server Revalidation
      ↓
Create Import Record
      ↓
Persist Eligible Feedback
      ↓
Record Counts / Errors
      ↓
Finalize Import Status
      ↓
Show Import Result
      ↓
Import History
```

AI classification and analytics remain separate.

---

# Goal

When a user confirms a CSV preview, SignalFlow should safely save the valid, non-duplicate feedback into the selected project and preserve an auditable import record.

After execution, the user should be able to answer:

- Did the import succeed?
- How many rows were imported?
- How many rows were invalid?
- How many duplicates were skipped?
- Did any execution error occur?
- When was the file imported?
- Which project received the feedback?
- What previous imports have been run?

The import history must be tenant-scoped and project-aware.

---

# Scope

## In Scope

- Confirm import action
- Server-side authorization
- Final server-side validation
- Final duplicate recheck
- Create `FeedbackImport`
- Persist valid feedback
- Skip invalid rows
- Skip duplicates
- Track import counters
- Import status transitions
- Handle execution failures
- Store safe import error information
- Import result screen
- Previous-import history
- Import detail/result view
- Tenant-scoped history queries
- Project-scoped history queries
- Empty/loading/error states
- Tests for persistence, status, counters, and isolation

## Out of Scope

Do not implement these as part of this feature:

- AI classification
- Sentiment analysis
- Topic extraction
- Embeddings
- Semantic search
- Analytics aggregation
- Insight generation
- Import rollback
- Editing imported feedback
- Deleting import history
- Re-running an old import
- Scheduled imports
- External integrations
- Background AI processing

Those should remain separate features.

---

# Dependencies

This feature assumes these already work:

```text
Authentication
Organization Workspaces
Project Management
CSV Import Preview
```

The execution request must operate within a trusted:

```text
organization
+
project
```

context.

Never persist feedback based only on browser-supplied ownership identifiers.

---

# Core Invariant

Preview is not the final correctness boundary.

Even if the browser already showed:

```text
1,201 ready
31 invalid
16 duplicates
```

the server must independently validate the import at execution time.

The final database operation must never trust preview counts or row statuses sent by the client.

---

# User Flow

```text
CSV Preview
      ↓
User reviews counts
      ↓
Click Import Feedback
      ↓
Server authenticates user
      ↓
Verify organization membership
      ↓
Verify project belongs to organization
      ↓
Revalidate mapping + rows
      ↓
Recheck duplicates
      ↓
Create FeedbackImport
      ↓
Persist eligible Feedback records
      ↓
Finalize counters/status
      ↓
Show result
      ↓
User can open Feedback Inbox or Import History
```

---

# Confirmation UI

At the end of preview:

```text
Ready to import

1,201 feedback rows will be imported.
31 invalid rows will be skipped.
16 duplicates will be skipped.

[ Back ]                    [ Import feedback ]
```

The action copy should make it clear that this step writes data.

Do not label it merely:

```text
Continue
```

Prefer:

```text
Import feedback
```

---

# What Gets Persisted

Recommended V1 behavior:

```text
VALID + non-duplicate
→ persist as Feedback

INVALID
→ do not create Feedback

DUPLICATE
→ do not create Feedback
```

The import record still stores counts for all categories.

---

# Final Revalidation

Before writing feedback, the server should repeat canonical validation using the same reusable logic as preview.

Conceptually:

```text
verify file/import preview state
      ↓
validate mapping
      ↓
transform rows
      ↓
validate candidates
      ↓
detect in-file duplicates
      ↓
query existing project duplicates
      ↓
build final eligible set
```

Do not maintain one validator for preview and a different validator for execution.

---

# Why Duplicate Recheck Is Required

The database may change between preview and confirmation.

Example:

```text
12:00 Preview says externalId T-100 is new.
12:01 Another import inserts T-100.
12:02 User confirms original preview.
```

Execution must detect that T-100 is now a duplicate.

Preview results are informational snapshots, not permanent guarantees.

---

# Import Record

Create a `FeedbackImport` record for the execution attempt according to the existing Prisma model.

The record should identify at least:

```text
organization
project
initiating user
file/import metadata
status
row counts
timestamps
```

Use the fields already defined by the project schema rather than inventing a parallel import table.

---

# Import Status

Use the statuses already defined by the application's schema.

Conceptually, the lifecycle should represent:

```text
pending / processing
      ↓
completed
```

or:

```text
pending / processing
      ↓
failed
```

Use the exact enum names from the existing Prisma schema.

Do not create a second UI-only status system that conflicts with database status.

---

# Recommended State Machine

Conceptually:

```text
CREATED
   ↓
PROCESSING
   ↓
COMPLETED
```

Failure path:

```text
CREATED
   ↓
PROCESSING
   ↓
FAILED
```

If the existing schema uses different names, use those names.

---

# Import Counters

Track deterministic counters.

Useful values:

```text
totalRows
validRows
importedRows
invalidRows
duplicateRows
```

If the existing `FeedbackImport` schema already has specific counter fields, use those exact fields.

The following invariant should hold where the validation model is mutually exclusive:

```text
totalRows
=
importedRows
+
invalidRows
+
duplicateRows
```

If later states introduce additional categories, update the invariant intentionally.

---

# Do Not Trust Client Counts

Unsafe:

```json
{
  "validRows": 1201,
  "invalidRows": 31,
  "duplicateRows": 16
}
```

as authoritative execution data.

The server calculates final counters from canonical row results.

---

# Feedback Persistence

Every inserted feedback record must receive trusted ownership context.

Conceptually:

```ts
{
  organizationId: trustedOrganization.id,
  projectId: trustedProject.id,
  importId: feedbackImport.id,
  ...
}
```

Never use an unverified browser organization ID to construct feedback rows.

---

# Candidate to Feedback Mapping

Conceptually:

```text
CandidateFeedback.content
→ Feedback content field

CandidateFeedback.source
→ Feedback source field

CandidateFeedback.externalId
→ Feedback external identifier

CandidateFeedback.customerReference
→ Feedback customer reference

CandidateFeedback.occurredAt
→ Feedback occurrence timestamp
```

Use the actual field names from the existing Prisma schema.

Do not add redundant columns simply because the preview type uses different naming.

---

# Bulk Insertion

Avoid one database round trip per row.

Bad:

```text
for every candidate:
  prisma.feedback.create(...)
```

Prefer an appropriate batch operation where compatible with the schema and required returned data.

Conceptually:

```ts
await prisma.feedback.createMany({
  data: feedbackRows,
});
```

If the implementation needs generated IDs or additional per-record behavior, choose the smallest safe alternative.

---

# Transaction Boundary

Import execution changes multiple related records:

```text
FeedbackImport
+
many Feedback records
+
final import counters/status
```

Define transaction behavior explicitly.

Recommended V1:

```text
Create import attempt
      ↓
Run persistence transaction
      ↓
Insert eligible feedback
      ↓
Update import counts/status
      ↓
Commit
```

If persistence fails, do not report the import as completed.

---

# Failure Semantics

Avoid a state where:

```text
500 feedback records were committed
but FeedbackImport says 0 imported
```

without an intentional partial-import model.

Recommended V1:

```text
atomic persistence for the eligible batch
```

when practical for supported file sizes.

Either the intended batch is committed and the import is finalized, or the persistence transaction rolls back.

---

# Import Attempt vs Transaction

A useful pattern is:

1. Create/import-attempt metadata.
2. Mark it processing.
3. Run the feedback persistence transaction.
4. Mark completed on success.
5. Mark failed on execution failure.

This allows failed attempts to appear in history.

Be careful that transaction rollback does not remove the only record describing the failure if failure history is required.

---

# Idempotency

Users may:

- double-click Import
- refresh
- retry a request
- experience a network timeout

The system should avoid creating the same import twice accidentally.

Use a server-controlled execution identifier or equivalent idempotency strategy if the preview/execution architecture supports it.

At minimum:

```text
disable confirmation while pending
+
enforce feedback uniqueness constraints
+
recheck duplicates server-side
```

A stronger idempotency key is recommended when execution requests can be retried.

---

# Duplicate Handling During Persistence

Duplicates identified during final validation are skipped.

Example:

```text
1,248 total
1,201 imported
31 invalid
16 duplicate
```

If a uniqueness race occurs during insertion, the database constraint remains the final safety layer.

Do not disable uniqueness protections just to make the import succeed.

---

# Database Uniqueness Errors

Translate expected duplicate conflicts into deterministic import behavior where possible.

Do not expose:

```text
Prisma unique constraint failed...
```

to the user.

If an unexpected database conflict prevents safe completion, fail the execution and record a safe error.

---

# Error Storage

Store safe execution error information on the import record if the existing schema supports it.

Good:

```text
Import could not be completed because the feedback batch could not be saved.
```

Internal logs may contain:

```text
error code
operation
organizationId
projectId
importId
```

Do not store or display raw stack traces as user-facing error text.

---

# Sensitive Feedback Data

Customer feedback may contain:

- names
- email-like references
- support conversations
- product complaints
- other customer-provided text

Avoid logging full raw feedback content during import execution.

Log metadata and identifiers instead whenever possible.

---

# Successful Result Screen

Example:

```text
Import complete

customer-feedback-september.csv

1,201 feedback items imported
31 invalid rows skipped
16 duplicates skipped

[ View feedback ]     [ Import history ]
```

If zero rows were imported, do not show a misleading success message.

---

# Completed With Skipped Rows

An import can still be considered successful when valid rows were persisted and invalid/duplicate rows were intentionally skipped.

Example:

```text
Import complete

1,201 imported
31 invalid rows skipped
16 duplicates skipped
```

This is different from an execution failure.

---

# Zero Eligible Rows

Normally preview should prevent confirmation when:

```text
eligibleRows === 0
```

The server must still defend against it.

If final revalidation finds zero eligible rows because data changed:

```text
do not create feedback
```

Return a clear result such as:

```text
No new feedback was imported.

All rows were invalid or already existed in this project.
```

Whether this execution is stored as completed-with-zero or another existing status is a product/schema decision.

Do not invent a new status without updating the data model intentionally.

---

# Failed Result Screen

Example:

```text
Import failed

We couldn't save this feedback import.

No feedback from this attempt was added.

[ Try again ]     [ Back to imports ]
```

Only claim:

```text
No feedback was added
```

if transaction semantics actually guarantee that.

---

# Import History

Users should be able to view previous imports for the active project.

Example:

```text
Import history

File                            Status       Imported   Invalid   Duplicates   Date
customer-feedback-september.csv Complete     1,201      31        16           Sep 11
support-export.csv              Complete       482       4         9           Sep 08
reviews.csv                     Failed           0       —         —           Sep 05
```

---

# History Scope

Default V1 recommendation:

```text
active project import history
```

This matches the project-centered SignalFlow experience.

A future organization-wide import history can be added separately.

---

# Tenant-Safe History Query

Safe conceptual query:

```ts
await prisma.feedbackImport.findMany({
  where: {
    organizationId,
    projectId,
  },
  orderBy: {
    createdAt: "desc",
  },
});
```

Do not:

```ts
findMany()
```

and filter in the browser.

---

# Import Detail Lookup

Import detail must include tenant context.

Prefer:

```ts
getFeedbackImport({
  organizationId,
  projectId,
  importId,
});
```

Avoid:

```ts
getFeedbackImport(importId);
```

as the tenant-aware repository contract.

---

# History Fields

Show useful metadata supported by the schema:

```text
file name
status
imported count
invalid count
duplicate count
created/imported date
```

Optional:

```text
initiated by
total rows
failure message
```

Do not display data that the schema does not actually persist.

---

# Import Detail Page

A detail view may show:

```text
customer-feedback-september.csv

Status
Complete

Project
nova robot

Imported
1,201

Invalid
31

Duplicates
16

Started
Sep 11, 2026

Completed
Sep 11, 2026
```

If execution failed:

```text
Status
Failed

Error
We couldn't save this feedback batch.
```

---

# Invalid Row History

There are two possible V1 designs.

## Option A — Store Counts Only

Persist:

```text
invalidRows = 31
duplicateRows = 16
```

but do not persist every rejected row.

Pros:

- simpler
- less storage
- less sensitive rejected data retained

Cons:

- historical row-level errors cannot be reopened later

## Option B — Persist Rejected-Row Details

Store safe structured rejection details.

Pros:

- detailed historical debugging

Cons:

- additional schema/storage/privacy complexity

Recommended initial approach:

```text
counts + execution-level errors
```

unless the current schema already includes row-level import-error storage.

The preview screen remains the detailed row-correction experience.

---

# Import History Empty State

Example:

```text
No imports yet

Upload your first CSV to start adding customer feedback.

[ Import feedback ]
```

This can also serve the onboarding first-import path.

---

# History Loading State

Use table/list skeletons.

Do not block the entire application shell while only import history is loading.

---

# History Error State

Example:

```text
We couldn't load import history.

[ Try again ]
```

Do not fall back to an empty state when the query actually failed.

---

# History Pagination

If imports grow over time, paginate.

Recommended repository shape:

```ts
listFeedbackImports({
  organizationId,
  projectId,
  cursor,
  limit,
});
```

Do not load unlimited history forever.

For an early V1 with few imports, a bounded recent list is acceptable.

---

# Sorting

Default:

```text
newest first
```

based on persisted creation timestamp.

---

# Filtering

V1 may optionally support:

```text
All
Completed
Failed
```

Do not overbuild filtering before the core history list works.

---

# Feedback Inbox Relationship

After successful execution:

```text
View feedback
```

should navigate to the current project's Feedback Inbox.

The newly inserted feedback should appear from the database.

Do not maintain a separate client-only imported-feedback collection.

---

# Onboarding Relationship

This feature completes the onboarding activation requirement.

Onboarding resolver should determine:

```text
Does this authorized project have a successfully completed first import
with persisted feedback?
```

If yes:

```text
FIRST_IMPORT
→ COMPLETE
```

Do not mark onboarding complete based solely on an import attempt record if no usable feedback was persisted.

---

# Background Processing Boundary

After persistence, later features may enqueue AI processing.

Keep that boundary explicit:

```text
CSV Import Execution
→ Feedback persisted
→ Import completed
```

Then separately:

```text
Background Processing
→ AI classification
→ embeddings
→ topics
→ analytics
```

The import transaction should not call an AI model for every row.

---

# Future Job Enqueueing

When background processing is implemented, execution may eventually:

```text
persist feedback
      ↓
commit
      ↓
enqueue processing job
```

Do not make database commit depend on an AI response.

Queue failure handling should be defined in the background-processing feature.

---

# Suggested Service API

Conceptually:

```ts
executeFeedbackImport({
  organizationId,
  projectId,
  previewTokenOrInput,
});
```

Responsibilities:

```text
authorize
revalidate
recheck duplicates
create/update import record
persist eligible feedback
calculate counters
finalize status
return result
```

---

# Suggested Result Type

```ts
type FeedbackImportExecutionResult = {
  importId: string;
  status: "COMPLETED" | "FAILED";
  totalRows: number;
  importedRows: number;
  invalidRows: number;
  duplicateRows: number;
};
```

Use actual database enum names rather than inventing incompatible status values.

---

# Suggested Repository Functions

```ts
createFeedbackImport({
  organizationId,
  projectId,
  userId,
  ...
});
```

```ts
markFeedbackImportProcessing({
  organizationId,
  projectId,
  importId,
});
```

```ts
insertFeedbackBatch({
  organizationId,
  projectId,
  importId,
  feedback,
});
```

```ts
completeFeedbackImport({
  organizationId,
  projectId,
  importId,
  counters,
});
```

```ts
failFeedbackImport({
  organizationId,
  projectId,
  importId,
  error,
});
```

```ts
listFeedbackImports({
  organizationId,
  projectId,
});
```

```ts
getFeedbackImport({
  organizationId,
  projectId,
  importId,
});
```

Exact names should follow the existing repository conventions.

---

# Suggested Structure

```text
src/
├── server/
│   ├── services/
│   │   └── feedback-import-service.ts
│   │
│   ├── repositories/
│   │   ├── feedback-import-repository.ts
│   │   └── feedback-repository.ts
│   │
│   └── feedback-import/
│       ├── csv-validation.ts
│       ├── duplicate-detection.ts
│       └── import-execution.ts
│
├── components/
│   └── feedback-import/
│       ├── import-confirmation.tsx
│       ├── import-execution-state.tsx
│       ├── import-result.tsx
│       ├── import-history-table.tsx
│       ├── import-history-row.tsx
│       └── import-status-badge.tsx
│
└── app/
    └── app/
        └── ...
```

Reuse the parser/validation code from CSV Import Preview.

---

# Server Component Strategy

Prefer Server Components for:

- import history
- import detail
- persisted import result
- initial project context

Use Client Components for:

- confirmation interaction
- pending execution state
- retry controls where necessary

Do not fetch all import history client-side just to render a table.

---

# Authorization Flow

Every import execution:

```text
Authenticated User
      ↓
Local Application User
      ↓
Active Organization
      ↓
Organization Membership
      ↓
Active/Requested Project
      ↓
Verify project.organizationId
      ↓
Execute import
```

Every history/detail request follows the same tenant boundary.

---

# Security Invariants

## Invariant 1

Only an authorized organization member may import into a project.

## Invariant 2

The project must belong to the verified organization.

## Invariant 3

Client preview counts are never authoritative.

## Invariant 4

Final validation and duplicate checks happen server-side.

## Invariant 5

Feedback ownership IDs come from trusted server context.

## Invariant 6

Import history queries include organization and project scope.

## Invariant 7

Knowing an import ID is not sufficient to access it.

## Invariant 8

Another tenant's external IDs never affect duplicate detection.

## Invariant 9

Import status must reflect actual persistence outcome.

## Invariant 10

AI processing is not part of the authoritative import transaction.

---

# Error Codes

Useful application-level errors:

```text
IMPORT_NOT_FOUND
IMPORT_NOT_READY
IMPORT_ALREADY_EXECUTED
IMPORT_VALIDATION_FAILED
IMPORT_NO_ELIGIBLE_ROWS
IMPORT_PERSISTENCE_FAILED
PROJECT_NOT_FOUND
```

Use the project's established error conventions.

Do not expose raw Prisma/database errors.

---

# Concurrency

Consider two import confirmations executing at nearly the same time.

Both may contain the same external ID.

Defense layers:

```text
server duplicate recheck
+
database uniqueness constraint
```

The database remains the final authority.

If a race creates a uniqueness conflict, handle it predictably rather than corrupting counters.

---

# Counter Correctness

Counters must reflect committed results.

Do not calculate:

```text
importedRows = eligibleRows.length
```

and persist it before knowing the insertion succeeded.

Finalize counters as part of successful execution.

---

# Import Status Badge

Suggested UI:

```text
Complete
Failed
Processing
```

Use exact schema terminology where possible.

Status must include text, not color alone.

---

# Visual Direction

Follow SignalFlow:

- dark-only
- near-black background
- elevated dark panels
- subtle borders
- green success/primary identity
- red for failed state
- yellow/orange for warnings/skipped rows
- compact tables
- Geist typography
- Lucide icons
- shadcn primitives

Avoid excessive celebration animation.

A successful import should feel clear and professional.

---

# Verification Scenario 1 — Successful Import

Preview:

```text
100 total
95 ready
3 invalid
2 duplicates
```

Execution:

```text
95 Feedback records inserted
FeedbackImport finalized
```

Result:

```text
95 imported
3 invalid
2 duplicates
Complete
```

---

# Scenario 2 — Duplicate Appears After Preview

Preview:

```text
externalId T-100 → ready
```

Before confirmation, another import creates T-100.

Execution:

```text
recheck
→ T-100 duplicate
→ skip it
```

Final counters reflect the new result.

---

# Scenario 3 — Persistence Failure

Execution begins but database write fails.

Expected:

```text
no misleading completed status
failure recorded safely
user sees Failed
```

If atomic batch semantics are promised:

```text
no partial feedback remains
```

---

# Scenario 4 — Double Confirmation

User clicks import twice or request retries.

Expected:

```text
one logical execution
```

or the second attempt is safely rejected.

Do not duplicate feedback.

---

# Scenario 5 — Cross-Tenant Project

User A submits Project B ID.

Expected:

```text
denied before import execution
```

No import record or feedback is created under Project B.

---

# Scenario 6 — Cross-Tenant Import History

User A manually requests Import B ID.

Expected:

```text
not found / inaccessible
```

No metadata about Organization B is revealed.

---

# Scenario 7 — History List

Project has three imports.

Expected:

```text
only those three project imports
newest first
correct statuses/counters
```

Imports from another project or organization do not appear.

---

# Scenario 8 — First Onboarding Import

New user completes:

```text
workspace
→ project
→ preview
→ execution
```

Successful persisted feedback causes onboarding resolver to return:

```text
COMPLETE
```

---

# Testing Strategy

## Execution Tests

```text
valid rows are persisted
invalid rows are skipped
duplicates are skipped
feedback gets correct organizationId
feedback gets correct projectId
feedback links to correct import
server recalculates counts
```

## Transaction Tests

```text
successful batch commits
failed batch does not report completed
counters match committed records
```

## Duplicate Race Tests

```text
duplicate introduced after preview is re-detected
uniqueness conflict is handled safely
```

## Authorization Tests

```text
unauthenticated import denied
non-member import denied
cross-organization project denied
cross-project import access denied
```

## History Tests

```text
history is project-scoped
history is organization-scoped
newest first
failed import visible
completed import visible
detail lookup requires tenant context
```

## Onboarding Test

```text
successful first import
→ onboarding COMPLETE
```

---

# Definition of Done

- [ ] User can confirm a validated CSV preview.
- [ ] Import execution authenticates the current user.
- [ ] Organization membership is verified.
- [ ] Project ownership is verified.
- [ ] Preview data is revalidated server-side.
- [ ] Duplicates are rechecked immediately before persistence.
- [ ] `FeedbackImport` execution record is created.
- [ ] Eligible feedback is persisted with trusted organization/project ownership.
- [ ] Invalid rows are skipped according to policy.
- [ ] Duplicate rows are skipped according to policy.
- [ ] Database uniqueness remains a final safety layer.
- [ ] Import counters are calculated server-side.
- [ ] Counters reflect committed results.
- [ ] Successful import receives the correct final status.
- [ ] Failed import receives the correct failure status.
- [ ] Raw database errors are not exposed.
- [ ] Result screen shows imported/invalid/duplicate counts.
- [ ] User can navigate to Feedback Inbox after success.
- [ ] User can view previous project imports.
- [ ] History is ordered newest first.
- [ ] History/detail queries include organization and project context.
- [ ] Cross-tenant import IDs do not leak metadata.
- [ ] Failed attempts can be represented accurately when supported.
- [ ] First successful import can complete onboarding.
- [ ] AI processing is not required for import completion.
- [ ] Loading, empty, failure, and success states exist.
- [ ] Responsive/accessibility basics are implemented.
- [ ] Lint passes.
- [ ] TypeScript passes.
- [ ] Relevant tests pass.
- [ ] Production build passes.
- [ ] `progress-tracker.md` is updated.

---

# Implementation Order

Keep this feature incremental.

## Unit 1 — Import Execution Contract

Implement the server operation shape:

```text
authorize
revalidate
return final eligible rows/counters
```

Do not persist yet.

Verify preview values cannot be trusted.

---

## Unit 2 — FeedbackImport Lifecycle

Implement:

```text
create attempt
processing state
complete state
failed state
```

using the existing schema statuses.

---

## Unit 3 — Feedback Persistence

Implement:

```text
eligible candidates
→ trusted ownership
→ batch persistence
```

Verify:

```text
organizationId
projectId
importId
```

for every row.

---

## Unit 4 — Transaction and Failure Handling

Verify:

```text
successful commit
failed execution
counter correctness
no misleading completion
```

---

## Unit 5 — Import Result

Render:

```text
status
file
imported
invalid
duplicates
actions
```

---

## Unit 6 — Import History

Implement tenant-aware:

```text
listFeedbackImports({
  organizationId,
  projectId,
})
```

Render newest first.

---

## Unit 7 — Import Detail

Implement:

```text
getFeedbackImport({
  organizationId,
  projectId,
  importId,
})
```

Show persisted result/error information.

---

## Unit 8 — Onboarding Completion

Connect successful first import to:

```text
resolveOnboardingState()
```

Verify:

```text
FIRST_IMPORT
→ COMPLETE
```

---

## Unit 9 — Isolation and Concurrency Verification

Explicitly test:

```text
cross-tenant access
double confirmation
duplicate race
failed persistence
```

Only after these pass should downstream processing begin.

---

# Recommended Immediate Coding Unit

Start with:

```text
Unit 1 — Import Execution Contract
```

The first implementation slice should prove:

```text
confirmed preview
      ↓
server re-authorizes
      ↓
server revalidates
      ↓
server rechecks duplicates
      ↓
returns authoritative eligible rows and counters
```

Do not combine persistence, history UI, and AI jobs in the first implementation.

---

# Relationship to Previous Feature

Previous feature:

```text
CSV Import Preview
```

ends at:

```text
Ready to import

1,201 ready
31 invalid
16 duplicates
```

This feature starts when the user clicks:

```text
Import feedback
```

and ends with:

```text
feedback persisted
+
import result saved
+
import visible in history
```

---

# Next Feature

After CSV Import Execution and History, the next natural product feature is:

```text
Feedback Inbox
```

It should allow users to view the actual persisted feedback for the active project before AI enrichment is added.

Recommended sequence:

```text
CSV Import Execution
      ↓
Feedback Inbox
      ↓
AI Classification
      ↓
Background Processing
      ↓
Dashboard Analytics
```

This ensures SignalFlow can reliably ingest and display real customer feedback before adding AI-derived interpretation.
