# Feedback Inbox

## Feature

Provide a project-scoped inbox for viewing the original customer feedback that has been imported into SignalFlow.

This feature begins after CSV import execution has successfully persisted feedback records.

Core experience:

```text
Feedback Inbox
      ↓
List Original Feedback
      ↓
Search / Filter / Paginate
      ↓
Open Individual Feedback Item
```

This feature intentionally focuses on source feedback before AI-derived enrichment such as sentiment, topics, summaries, embeddings, or insights.

---

# Goal

Users should be able to reliably inspect the customer feedback stored in the active project.

The inbox should answer:

- What feedback has been imported?
- What did the customer actually say?
- Where did it come from?
- When did it occur?
- Which import created it?
- Can I quickly find a specific feedback item?
- Can I narrow the list using basic filters?
- Can I move through large result sets safely?

The inbox must preserve the original feedback text as the primary source of truth.

---

# Scope

## In Scope

- Project-scoped feedback list
- Original feedback content
- Feedback item detail
- Pagination
- Keyword search
- Basic filters
- Stable sorting
- URL/query-state support where appropriate
- Empty states
- No-results states
- Loading states
- Error states
- Tenant-scoped queries
- Project-scoped queries
- Import/source metadata display
- Server-side search/filter/pagination
- Accessibility
- Responsive inbox UI
- Tests for list, detail, search, filters, pagination, and isolation

## Out of Scope

Do not implement these as part of this feature:

- AI sentiment
- Topic classification
- AI summaries
- Embeddings
- Semantic search
- Similar-feedback search
- Analytics charts
- Insight generation
- Feedback editing
- Feedback deletion
- Bulk actions
- Manual tagging
- Assignment/workflows
- Comments
- Export
- Saved searches
- Advanced query syntax

Those belong to later features.

---

# Dependencies

This feature assumes these already work:

```text
Authentication
Organization Workspaces
Project Management
CSV Import Preview
CSV Import Execution and History
```

Feedback records must already exist in PostgreSQL and be associated with trusted:

```text
organizationId
projectId
```

context.

---

# Core Invariant

Feedback Inbox is a read interface over persisted source feedback.

It should not reinterpret or rewrite the customer's message.

The stored original content remains authoritative.

---

# User Flow

```text
Open active project
      ↓
Feedback
      ↓
Server resolves organization/project access
      ↓
Load first page of feedback
      ↓
User searches / filters / paginates
      ↓
Open feedback item
      ↓
Inspect full original feedback + metadata
```

---

# Route Strategy

Recommended routes:

```text
/app/feedback
```

for the active project model,

or:

```text
/app/projects/[projectId]/feedback
```

if the application uses project IDs in URLs.

The route itself is not authorization.

Every request must still verify:

```text
organization membership
+
project ownership
```

---

# Feedback List

The inbox should render a compact, readable list or table of original feedback.

Recommended columns:

```text
Feedback
Source
Customer
Occurred
Imported
```

Optional:

```text
External ID
```

Do not add AI-derived columns before those features exist.

---

# Example List

```text
Feedback

Search feedback...
[ All sources ▾ ] [ Date ▾ ]

Showing 1–25 of 1,201

┌─────────────────────────────────────────────────────────────┐
│ Feedback                     Source    Customer    Occurred  │
├─────────────────────────────────────────────────────────────┤
│ App crashes after login      Support   CUST-102    Sep 10    │
│ Please add PDF export        Survey    CUST-188    Sep 09    │
│ Search is much faster now    Review    —           Sep 08    │
└─────────────────────────────────────────────────────────────┘

[ Previous ]                              [ Next ]
```

---

# Original Feedback Content

Each list row should show a useful preview of the original feedback text.

Example:

```text
"App crashes every time I try to open the settings page..."
```

Use truncation for list readability.

Do not mutate the stored content.

The detail view should show the full text.

---

# Feedback Detail

Opening an item should show:

```text
full original content
source
external ID
customer reference
occurredAt
created/imported timestamp
import reference
```

Only show fields that actually exist.

Example:

```text
Feedback

App crashes every time I try to open the settings page after logging in.

Source
Support

External ID
TICKET-1042

Customer
customer-88

Occurred
September 10, 2026

Imported
September 11, 2026
```

---

# Detail UI Pattern

Possible V1 patterns:

## Option A — Dedicated Page

```text
/app/feedback/[feedbackId]
```

Pros:

- deep-linkable
- accessible
- simple server rendering

## Option B — Side Panel / Drawer

Pros:

- preserves inbox context
- faster browsing

Recommended V1:

```text
dedicated route or route-backed sheet
```

so the detail remains directly addressable.

---

# Trusted Feedback Lookup

A feedback ID alone must never be sufficient.

Prefer:

```ts
getFeedback({
  organizationId,
  projectId,
  feedbackId,
});
```

Conceptual query:

```ts
await prisma.feedback.findFirst({
  where: {
    id: feedbackId,
    organizationId,
    projectId,
  },
});
```

Do not use a global unscoped feedback lookup as the authorization boundary.

---

# Pagination

Use server-side pagination.

Do not load every feedback row into the browser and paginate locally.

Two common approaches:

```text
offset pagination
cursor pagination
```

Recommended V1:

```text
cursor pagination
```

when practical for growing datasets.

Offset pagination is acceptable if the expected dataset is small and the implementation stays simple.

---

# Cursor Pagination

Conceptual request:

```ts
listFeedback({
  organizationId,
  projectId,
  cursor,
  limit,
});
```

Response:

```ts
type FeedbackPage = {
  items: FeedbackListItem[];
  nextCursor: string | null;
  previousCursor?: string | null;
};
```

Keep the sort key stable.

---

# Stable Sort

Recommended default:

```text
newest first
```

Use a stable order such as:

```text
occurredAt DESC
id DESC
```

or:

```text
createdAt DESC
id DESC
```

depending on product intent.

If `occurredAt` can be null, define null ordering explicitly.

---

# Recommended Default Sort

For a customer-feedback inbox, useful default behavior is:

```text
occurredAt DESC
```

with fallback to imported/created time when no occurred date exists.

Exact Prisma ordering should be deterministic.

Do not silently change sort order between pages.

---

# Page Size

Choose a reasonable V1 page size.

Example:

```text
25
```

or:

```text
50
```

Use one default consistently.

Do not expose unbounded `limit` input from the browser.

Server should clamp allowed page size.

---

# Pagination UI

Example:

```text
Showing 1–25

[ Previous ]     [ Next ]
```

If total count is cheaply available:

```text
Showing 1–25 of 1,201
```

If count queries become expensive later, total-count display can be reconsidered.

---

# Keyword Search

Support basic keyword search over original feedback content.

Example:

```text
Search feedback
[ crash login                         ]
```

Search should operate within the active organization/project.

---

# Search Scope

Recommended V1 fields:

```text
feedback content
externalId
customerReference
```

Primary field:

```text
content
```

Do not include AI-generated fields before AI enrichment exists.

---

# Search Semantics

V1 can use simple case-insensitive substring search.

Conceptually:

```ts
where: {
  organizationId,
  projectId,
  OR: [
    {
      content: {
        contains: query,
        mode: "insensitive",
      },
    },
    {
      externalId: {
        contains: query,
        mode: "insensitive",
      },
    },
    {
      customerReference: {
        contains: query,
        mode: "insensitive",
      },
    },
  ],
}
```

Adjust exact syntax to current Prisma/PostgreSQL behavior.

---

# Search Input Validation

Normalize:

```text
trim whitespace
```

If empty:

```text
treat as no search
```

Define a sensible maximum query length.

If no product limit exists yet, keep the implementation bounded without presenting an invented product rule.

---

# Search Behavior

Recommended:

```text
search submitted through URL query parameter
```

Example:

```text
/app/feedback?q=crash
```

This allows:

- refresh persistence
- shareable state
- browser navigation
- server rendering

---

# Debouncing

If using live search, debounce client updates.

Do not send a request on every keystroke without control.

Alternative V1:

```text
submit search explicitly
```

Simpler and easier to verify.

---

# Basic Filters

Recommended V1 filters:

```text
Source
Date range
Import
```

Optionally:

```text
Has customer reference
```

Keep filters based on existing persisted fields only.

---

# Source Filter

Example:

```text
Source
[ All sources ▾ ]
```

Options come from actual project data or known imported source values.

Do not invent source categories.

---

# Source Query

Conceptually:

```ts
where: {
  organizationId,
  projectId,
  source: selectedSource,
}
```

---

# Date Filter

Useful V1 date options:

```text
All time
Last 7 days
Last 30 days
Custom range
```

If custom range is not needed initially:

```text
All time
Last 7 days
Last 30 days
```

is enough.

Date filtering should target:

```text
occurredAt
```

when the user is filtering when feedback happened.

---

# Import Filter

Allow narrowing to one import.

Example:

```text
Import
[ customer-feedback-september.csv ▾ ]
```

Query must verify the import belongs to the active project.

Do not allow arbitrary import IDs from other projects.

---

# Combined Filters

Search and filters should compose.

Example:

```text
query = "crash"
source = "Support"
last 30 days
```

means:

```text
organization/project scope
AND
keyword condition
AND
source condition
AND
date condition
```

Do not implement filters as independent client-only subsets.

---

# Query State

Recommended URL parameters:

```text
q
source
importId
from
to
cursor
```

Example:

```text
/app/feedback?q=crash&source=Support
```

Only include parameters actually implemented.

---

# Reset Filters

Provide:

```text
Clear filters
```

when filters/search are active.

Reset should return to:

```text
default list
first page
```

---

# Pagination Reset

When search or filter criteria change:

```text
reset pagination
```

Do not reuse a cursor generated for a previous filter set.

---

# Empty State — No Feedback

If the project has no feedback:

```text
No feedback yet

Import a CSV to start building your feedback inbox.

[ Import feedback ]
```

This should connect to the import flow.

---

# No Search Results

If feedback exists but filters return nothing:

```text
No feedback matches your search.

Try a different keyword or clear your filters.

[ Clear filters ]
```

Do not show the first-import empty state.

---

# Loading State

Use:

```text
row skeletons
```

or a compact list skeleton.

Keep shell/navigation visible.

---

# Error State

Example:

```text
We couldn't load feedback.

[ Try again ]
```

Do not render an empty list if the server query failed.

---

# Feedback List Item Type

Conceptually:

```ts
type FeedbackListItem = {
  id: string;
  contentPreview: string;
  source: string | null;
  externalId: string | null;
  customerReference: string | null;
  occurredAt: Date | null;
  createdAt: Date;
  importId: string | null;
};
```

Use actual schema fields.

Do not duplicate persisted fields unnecessarily.

---

# Feedback Detail Type

Conceptually:

```ts
type FeedbackDetail = {
  id: string;
  content: string;
  source: string | null;
  externalId: string | null;
  customerReference: string | null;
  occurredAt: Date | null;
  createdAt: Date;
  import: {
    id: string;
    fileName: string | null;
  } | null;
};
```

Only include authorized project data.

---

# Repository API

Recommended:

```ts
listFeedback({
  organizationId,
  projectId,
  query,
  source,
  importId,
  dateRange,
  cursor,
  limit,
});
```

Recommended:

```ts
getFeedback({
  organizationId,
  projectId,
  feedbackId,
});
```

Optional:

```ts
countFeedback({
  organizationId,
  projectId,
  filters,
});
```

Avoid repository methods that omit tenant scope.

---

# Service Layer

Possible operations:

```text
listProjectFeedback()
getProjectFeedback()
```

Responsibilities:

```text
validate filter/search inputs
authorize context
call tenant-aware repository
shape result for UI
```

Keep UI-specific display formatting out of repository code.

---

# Authorization Flow

Every list/detail request:

```text
requireApplicationUser()
      ↓
resolve active organization
      ↓
verify organization membership
      ↓
resolve active/requested project
      ↓
verify project.organizationId
      ↓
run feedback query with organizationId + projectId
```

Fail closed.

---

# Tenant Isolation

Safe list query:

```ts
await prisma.feedback.findMany({
  where: {
    organizationId,
    projectId,
  },
});
```

Unsafe:

```ts
await prisma.feedback.findMany();
```

then browser filtering.

---

# Detail Isolation

Safe:

```ts
await prisma.feedback.findFirst({
  where: {
    id: feedbackId,
    organizationId,
    projectId,
  },
});
```

If not found:

```text
404-style response
```

Do not reveal that the item exists in another tenant.

---

# Import Filter Isolation

When filtering by import:

```text
organizationId
+
projectId
+
importId
```

must all align.

Do not trust an arbitrary `importId` query parameter.

---

# Search Security

Search terms are untrusted.

Use ORM parameterization.

Do not concatenate user search text into raw SQL.

If raw PostgreSQL search is introduced later, parameterize all inputs.

---

# Content Rendering Security

Imported feedback is untrusted text.

Render as plain text by default.

Do not use unsafe raw HTML rendering.

Example:

```text
<script>alert(1)</script>
```

must display as text.

---

# Query Performance

Create/query indexes based on actual schema and usage.

Likely access pattern:

```text
organizationId
projectId
createdAt / occurredAt
```

Search optimization may be added later.

Do not introduce embeddings for simple keyword search.

---

# Keyword Search Scaling

V1:

```text
ILIKE / Prisma contains
```

Later, if required:

```text
PostgreSQL full-text search
trigram index
```

This should be a separate optimization once data volume justifies it.

---

# Avoid N+1 Queries

If showing import file metadata for list rows, avoid fetching one import per feedback item.

Use:

```text
select/include
```

or a bounded join strategy.

Do not query import information inside a loop.

---

# Total Count

If displaying:

```text
1,201 total
```

perform a count using the same tenant/search/filter conditions.

Ensure:

```text
count query filters == list query filters
```

Do not show global project totals while the list is filtered unless clearly labeled.

---

# Date Display

Display dates consistently.

Example:

```text
Sep 10, 2026
```

For detail:

```text
September 10, 2026
```

Do not transform the stored occurrence time into a misleading date.

---

# Missing Metadata

If optional source/customer/date is absent, display:

```text
—
```

or:

```text
Unknown
```

Choose one convention consistently.

Do not fabricate values.

---

# Feedback Preview Truncation

List view:

```text
truncate visually
```

Example max:

```text
2–3 lines
```

Detail view:

```text
full original content
```

Do not truncate data at the repository/storage layer.

---

# UI Layout

Recommended desktop structure:

```text
┌───────────────────────────────────────────────────────────┐
│ Feedback                         [ Import feedback ]       │
│                                                           │
│ [ Search feedback...           ] [ Source ▾ ] [ Date ▾ ] │
│                                                           │
│ 1,201 feedback items                                      │
│                                                           │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ App crashes after login                              │ │
│ │ Support · customer-88 · Sep 10                      │ │
│ ├───────────────────────────────────────────────────────┤ │
│ │ Please add PDF export                               │ │
│ │ Survey · customer-91 · Sep 09                       │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                           │
│ [ Previous ]                               [ Next ]       │
└───────────────────────────────────────────────────────────┘
```

---

# Table vs List

Either can work.

Recommended SignalFlow V1:

```text
dense list/table hybrid
```

because feedback text is the primary content and can be long.

Keep metadata secondary.

---

# Mobile Layout

Avoid wide table dependence.

Example:

```text
Feedback

[ Search... ]

[ Source ▾ ] [ Date ▾ ]

App crashes after login...
Support
Sep 10

────────────────

Please add PDF export...
Survey
Sep 09
```

Filters may wrap or open in a filter sheet.

---

# Detail Layout

Desktop:

```text
Feedback detail

Original feedback
────────────────────────────
App crashes every time...

Metadata

Source
Support

Customer
customer-88

External ID
TICKET-1042

Occurred
Sep 10, 2026

Imported from
support-export.csv
```

Keep AI sections absent until implemented.

---

# Import Action

Inbox header should make importing additional feedback easy.

Example:

```text
[ Import feedback ]
```

This should open/navigate to the existing CSV import flow.

Do not create a second import implementation inside Feedback Inbox.

---

# Filter Options Source

When source filter values are dynamic, query distinct source values only within:

```text
organizationId + projectId
```

Do not expose source values from other tenants.

---

# Server Component Strategy

Prefer Server Components for:

- initial feedback list
- search/filter results
- feedback detail
- total counts
- filter option data

Use Client Components for:

- search input interaction
- dropdown behavior
- mobile filter sheet
- pagination controls when needed

Do not load the entire inbox through a client effect by default.

---

# URL-Driven Inbox

Recommended request flow:

```text
URL search params
      ↓
Server Component
      ↓
validate search/filter params
      ↓
tenant-aware service
      ↓
repository
      ↓
PostgreSQL
```

Benefits:

- reload-safe
- shareable
- browser history
- simple server data flow

---

# Filter Validation

Treat all query parameters as untrusted.

Validate:

```text
q
source
importId
date range
cursor
limit
```

Reject or normalize invalid values.

---

# Date Range Validation

Ensure:

```text
from <= to
```

and parse dates explicitly.

Do not allow malformed dates to reach repository logic.

---

# Cursor Validation

Cursor values are untrusted.

Use server-generated opaque cursors or validate decoded cursor structure.

Do not expose a cursor that allows arbitrary tenant/resource access.

---

# Accessibility

Requirements:

- semantic search input label
- filter controls labeled
- pagination controls keyboard accessible
- list/table rows keyboard reachable when clickable
- detail links have meaningful names
- loading status announced appropriately
- no-results state readable
- focus state visible
- status/filter state not communicated by color alone

---

# Visual Direction

Use existing SignalFlow design:

- dark-only
- near-black base
- dark elevated panels
- subtle borders
- green primary controls
- muted secondary metadata
- compact table/list density
- Geist typography
- Lucide icons
- shadcn components

Do not overuse card containers.

The feedback text should remain visually dominant.

---

# Verification Scenario 1 — Basic List

Project A contains 40 feedback records.

Expected:

```text
first page returns project A feedback only
stable order
pagination available
```

---

# Scenario 2 — Pagination

Page size:

```text
25
```

Expected:

```text
page 1 → 25
page 2 → remaining 15
```

No duplicates or missing items between pages under stable data/order.

---

# Scenario 3 — Keyword Search

Feedback:

```text
"App crashes when I log in"
"Please add export"
```

Search:

```text
crash
```

Expected:

```text
only matching feedback
```

---

# Scenario 4 — Source Filter

Records:

```text
Support
Survey
Review
```

Filter:

```text
Support
```

Expected:

```text
only Support records
```

---

# Scenario 5 — Combined Search + Filter

Search:

```text
login
```

Source:

```text
Support
```

Expected:

```text
records matching both conditions
```

---

# Scenario 6 — No Results

Feedback exists, but search has no matches.

Expected:

```text
No feedback matches your search.
```

Not:

```text
No feedback yet.
```

---

# Scenario 7 — Empty Project

No feedback records.

Expected:

```text
No feedback yet
[ Import feedback ]
```

---

# Scenario 8 — Detail View

Open one authorized feedback item.

Expected:

```text
full original content
correct metadata
correct import association
```

---

# Scenario 9 — Cross-Tenant Feedback ID

User A requests exact Feedback B ID.

Expected:

```text
not found / inaccessible
```

No metadata leak.

---

# Scenario 10 — Cross-Project Feedback ID

User can access two projects but opens Project A while manually requesting Feedback B from Project B.

Expected:

```text
not found
```

The query must include active/requested project scope.

---

# Scenario 11 — Cross-Tenant Import Filter

User injects another organization's import ID into query params.

Expected:

```text
no cross-tenant results
```

Prefer rejecting/ignoring invalid filter value according to the application's error convention.

---

# Testing Strategy

## Repository Tests

```text
list requires organizationId
list requires projectId
detail requires organizationId + projectId + feedbackId
filters compose correctly
stable pagination
```

## Search Tests

```text
content keyword matches
external ID keyword matches if included
customer reference matches if included
case-insensitive behavior
empty search behaves as no search
```

## Filter Tests

```text
source filter
date filter
import filter
combined filters
invalid filter input
```

## Pagination Tests

```text
first page
next page
end of list
filter change resets cursor
stable sort
```

## Authorization Tests

```text
unauthenticated denied
non-member denied
cross-organization denied
cross-project detail denied
```

## UI Tests

```text
load inbox
search
filter
clear filters
paginate
open item
return to inbox
```

---

# Definition of Done

- [ ] Active project feedback can be listed.
- [ ] List query includes organizationId and projectId.
- [ ] Original feedback content is displayed without AI rewriting.
- [ ] Feedback list uses stable server-side pagination.
- [ ] Page size is bounded server-side.
- [ ] User can navigate through pages.
- [ ] Keyword search works against defined persisted fields.
- [ ] Search is tenant/project scoped.
- [ ] Basic source filter works.
- [ ] Basic date filter works if included in V1.
- [ ] Import filter works if included in V1.
- [ ] Search and filters compose.
- [ ] Filter changes reset pagination.
- [ ] Clear filters returns the default list.
- [ ] Empty project state links to import flow.
- [ ] No-results state is distinct from empty project.
- [ ] Individual feedback item can be opened.
- [ ] Detail lookup includes organization/project scope.
- [ ] Exact cross-tenant feedback IDs do not leak data.
- [ ] Imported content is rendered safely as text.
- [ ] Optional missing metadata is displayed truthfully.
- [ ] Loading/error states are implemented.
- [ ] Desktop/mobile layouts are usable.
- [ ] Keyboard/focus/accessibility basics are implemented.
- [ ] Lint passes.
- [ ] TypeScript passes.
- [ ] Relevant tests pass.
- [ ] Production build passes.
- [ ] `progress-tracker.md` is updated.

---

# Implementation Order

Keep the feature incremental.

## Unit 1 — Feedback List Repository

Implement:

```text
listFeedback({
  organizationId,
  projectId,
  limit,
  cursor,
})
```

Verify:

```text
tenant scope
project scope
stable sort
pagination
```

Do not add search yet.

---

## Unit 2 — Inbox List UI

Render:

```text
feedback preview
source
customer
date
loading
empty
error
pagination
```

---

## Unit 3 — Feedback Detail

Implement:

```text
getFeedback({
  organizationId,
  projectId,
  feedbackId,
})
```

Then render full original content + metadata.

Verify cross-project access fails.

---

## Unit 4 — Keyword Search

Add validated:

```text
q
```

Server query should remain project scoped.

Reset pagination when search changes.

---

## Unit 5 — Basic Filters

Add one filter at a time:

```text
source
date
import
```

Only implement filters needed for V1.

Verify combinations.

---

## Unit 6 — URL State

Make:

```text
search
filters
pagination
```

refresh-safe through validated URL/query state where appropriate.

---

## Unit 7 — Isolation and Performance Verification

Test:

```text
cross-tenant IDs
cross-project IDs
N+1 behavior
bounded page size
stable pagination
```

---

# Recommended Immediate Coding Unit

Start with:

```text
Unit 1 — Feedback List Repository
```

The first slice should prove only:

```text
authorized project
      ↓
load first bounded page
      ↓
show original feedback
      ↓
next-page query works
```

Do not combine search, filters, detail drawers, and AI enrichment in the first implementation.

---

# Relationship to Previous Features

Previous:

```text
CSV Import Execution and History
```

creates persisted:

```text
Feedback
```

records.

This feature provides the first direct product view over those records.

The relationship is:

```text
Import CSV
      ↓
Persist Feedback
      ↓
Feedback Inbox
      ↓
Inspect Source Feedback
```

---

# AI Boundary

The Feedback Inbox initially displays factual persisted source data only.

Later AI enrichment may add:

```text
sentiment
topics
summaries
classification
```

but those values must remain visually distinguishable from the original customer text.

Never replace source feedback with an AI summary.

---

# Next Feature

After Feedback Inbox, the next natural feature is:

```text
AI Feedback Classification
```

Recommended scope:

```text
structured schema
sentiment
topic/category extraction
urgency or intent if explicitly defined
validation
model version
analysis persistence
```

Then:

```text
Background Processing
```

can process imported feedback asynchronously and populate those derived fields.
