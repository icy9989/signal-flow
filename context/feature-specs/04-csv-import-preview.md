# CSV Import Preview

## Feature

Build the pre-import workflow for customer feedback CSV files.

This feature covers:

```text
Upload CSV
   ↓
Parse File
   ↓
Detect Columns
   ↓
Map Columns
   ↓
Validate Rows
   ↓
Detect Duplicates
   ↓
Preview Import
```

The purpose of this feature is to let users inspect and correct an import before any feedback records are permanently inserted into the database.

This is the validation and preview stage of the broader CSV Feedback Import workflow.

---

# Goal

A user should be able to upload a CSV file and understand, before confirmation:

- whether the file can be parsed
- which columns were detected
- which SignalFlow fields each column maps to
- which rows are valid
- which rows are invalid
- which rows appear to be duplicates
- how many rows are ready to import

The preview must be based on real parsed CSV data.

Do not generate fake counts or simulated preview rows.

---

# Scope

## In Scope

- Select/upload CSV file
- Validate file type
- Validate basic file constraints
- Parse CSV
- Read headers
- Detect likely column mappings
- Allow user to adjust mappings
- Validate required fields
- Validate row-level data
- Detect duplicates within the uploaded file
- Detect duplicates against existing project feedback when possible
- Classify rows by import readiness
- Preview mapped feedback
- Show row-level validation errors
- Show duplicate warnings
- Show summary counts
- Allow user to continue only when import requirements are satisfied
- Loading/error/empty states
- Tenant-aware duplicate checks
- Tests for parsing, mapping, validation, and duplicate detection

## Out of Scope

Do not implement these as part of this feature:

- Final database insertion
- FeedbackImport completion transaction
- Background jobs
- AI classification
- Embeddings
- Analytics
- Topic extraction
- Import history page
- Rollback
- Automatic cleanup of already imported data
- Spreadsheet formats other than CSV unless intentionally added later
- Large-scale streaming ingestion optimization unless file-size requirements require it

Those belong to later units.

---

# Dependency

This feature assumes these are already available:

```text
Authentication
Organization Workspaces
Project Management
Onboarding Flow shell
```

A CSV preview must always execute in a trusted:

```text
organization
+
project
```

context.

The browser must not be allowed to preview data under an arbitrary tenant or project.

---

# Core User Flow

```text
Open project
   ↓
Import Feedback
   ↓
Choose CSV file
   ↓
Parse file
   ↓
Show detected headers
   ↓
Suggest mappings
   ↓
User confirms/adjusts mappings
   ↓
Validate rows
   ↓
Detect duplicates
   ↓
Show preview summary + table
   ↓
User fixes mapping/file or continues
```

---

# Import Stages

Use explicit stages.

Conceptually:

```ts
type CsvPreviewStage =
  | "SELECT_FILE"
  | "PARSING"
  | "MAPPING"
  | "VALIDATING"
  | "PREVIEW"
  | "ERROR";
```

The UI may represent these states differently, but the flow should remain predictable.

---

# Step 1 — File Selection

## UI

Example:

```text
Import feedback

Upload a CSV file to preview and validate your customer feedback.

[ Choose CSV file ]

CSV only
```

Optional helper text:

```text
You'll be able to map columns and review invalid rows before importing.
```

---

# File Rules

At minimum validate:

```text
file exists
file type is CSV or accepted text/csv equivalent
file is not empty
file contains at least one header row
file contains at least one data row
```

If the project defines a maximum file size, enforce it consistently.

Do not silently invent a permanent product limit.

If a temporary engineering limit is required, document it clearly.

---

# File Name

Preserve the original file name for display.

Example:

```text
customer-feedback-september.csv
```

Do not trust the file name as a source of tenant identity or metadata.

---

# File Parsing

Parse the CSV into:

```text
headers
rows
```

Example:

```csv
ticket_id,message,email,date,channel
123,"App keeps crashing",a@example.com,2026-09-01,support
124,"Please add dark mode",b@example.com,2026-09-02,survey
```

Parsed shape:

```ts
type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
};
```

Preserve original row positions for error reporting.

---

# Row Numbering

Track source row number.

Example:

```text
CSV line 2
CSV line 3
CSV line 4
```

This is important for actionable validation errors.

Recommended internal shape:

```ts
type ParsedCsvRow = {
  rowNumber: number;
  values: Record<string, string>;
};
```

---

# Parsing Errors

Handle:

- malformed quotes
- inconsistent column counts
- missing headers
- empty file
- unsupported encoding when detectable
- parser failure

Example user message:

```text
We couldn't read this CSV.

Check the file format and try again.
```

If specific row parsing errors are available, show them without exposing raw internal exceptions.

---

# Step 2 — Column Detection

After parsing, list detected CSV headers.

Example:

```text
Detected columns

ticket_id
message
email
date
channel
```

The system should suggest likely mappings to SignalFlow fields.

---

# SignalFlow Import Fields

For V1, useful target fields may include:

```text
content
source
externalId
customerReference
occurredAt
```

The exact import schema should follow the existing Feedback model.

At minimum:

```text
content
```

must be mapped for a row to become feedback.

Other fields may be optional.

---

# Recommended Mapping Model

Conceptually:

```ts
type ImportField =
  | "content"
  | "source"
  | "externalId"
  | "customerReference"
  | "occurredAt";
```

Mapping:

```ts
type ColumnMapping = {
  content?: string;
  source?: string;
  externalId?: string;
  customerReference?: string;
  occurredAt?: string;
};
```

Example:

```text
SignalFlow field      CSV column

Feedback content      message
Source                channel
External ID           ticket_id
Customer reference    email
Occurred at           date
```

---

# Auto-Detection

Use deterministic header-name matching.

Examples:

```text
content
message
feedback
comment
review
text
description
```

may suggest:

```text
content
```

Examples:

```text
id
ticket_id
feedback_id
external_id
```

may suggest:

```text
externalId
```

Examples:

```text
date
created_at
timestamp
submitted_at
occurred_at
```

may suggest:

```text
occurredAt
```

Do not use AI for basic CSV header matching unless there is a clear future reason.

Deterministic matching is easier to test and cheaper to run.

---

# Mapping Confidence

If auto-detection is uncertain, leave the field unmapped instead of guessing aggressively.

Example:

```text
Feedback content
[ Select column ▾ ]
```

The user must be able to change every suggested mapping.

---

# Mapping Rules

## Required

```text
content
```

must map to one CSV column.

## Optional

```text
source
externalId
customerReference
occurredAt
```

may remain unmapped.

Do not allow the same CSV column to be mapped to incompatible fields unless the product intentionally permits reuse.

Recommended V1:

```text
one source column → one target field
```

---

# Mapping UI

Example:

```text
Map columns

Tell SignalFlow what each CSV column represents.

Feedback content *
[ message              ▾ ]

Source
[ channel              ▾ ]

External ID
[ ticket_id            ▾ ]

Customer reference
[ email                ▾ ]

Occurred at
[ date                 ▾ ]

[ Preview import ]
```

---

# Mapping Validation

Before row validation:

```text
content mapping exists
mapped columns exist in parsed headers
no duplicate mapping conflicts
```

If invalid:

```text
Select a column for Feedback content.
```

Do not proceed to row validation with an invalid mapping.

---

# Step 3 — Row Transformation

Transform each parsed row into a normalized candidate feedback record.

Conceptually:

```ts
type CandidateFeedback = {
  rowNumber: number;
  content: string;
  source: string | null;
  externalId: string | null;
  customerReference: string | null;
  occurredAt: Date | null;
};
```

Normalization should be deterministic.

---

# String Normalization

Recommended behavior:

```text
trim surrounding whitespace
convert empty strings to null for optional fields
preserve meaningful internal whitespace
```

For required `content`:

```text
trim
then validate non-empty
```

Do not rewrite the user's feedback text beyond simple import normalization.

---

# Date Parsing

For mapped `occurredAt` values:

```text
parse only supported date formats
```

If a value cannot be parsed:

```text
mark row invalid or field invalid according to product rule
```

Recommended V1:

If `occurredAt` is mapped and a non-empty value is invalid:

```text
row is invalid
```

This prevents silently storing misleading dates.

---

# Source Normalization

If source is provided:

```text
trim value
```

Do not invent a source when the file has none unless the import UI intentionally allows the user to assign one global source.

A global source override can be a future enhancement.

---

# Step 4 — Row Validation

Each row should receive a clear status.

Conceptually:

```ts
type PreviewRowStatus =
  | "VALID"
  | "INVALID"
  | "DUPLICATE";
```

If a row is both invalid and duplicate, validation precedence should be explicit.

Recommended V1:

```text
INVALID takes precedence
```

because the row cannot be imported regardless of duplicate status.

---

# Validation Result Shape

Conceptually:

```ts
type RowValidationResult = {
  rowNumber: number;
  status: "VALID" | "INVALID" | "DUPLICATE";
  candidate: CandidateFeedback;
  errors: string[];
  duplicateReason?: string;
};
```

---

# Required Content Validation

Invalid:

```text
missing
empty
whitespace only
```

Example:

```text
Row 18
Feedback content is required.
```

---

# Optional Field Validation

If optional field is unmapped:

```text
valid
```

If mapped but empty:

```text
usually valid → null
```

If mapped with malformed structured data:

```text
invalid
```

Example:

```text
Occurred at is not a valid date.
```

---

# Validation Summary

After validation, compute:

```text
total rows
valid rows
invalid rows
duplicate rows
```

Example:

```text
1,248 total rows
1,201 ready
31 invalid
16 duplicates
```

These values must come from deterministic validation results.

---

# Step 5 — Duplicate Detection

Duplicate detection should happen before final import.

There are two duplicate categories:

```text
duplicates inside the uploaded CSV
duplicates against existing project feedback
```

Keep the reason visible.

---

# In-File Duplicate Detection

Preferred duplicate key:

```text
externalId
```

when it exists.

If two candidate rows have the same non-empty external ID:

```text
mark subsequent/conflicting rows as duplicates
```

Example:

```text
Row 14 duplicates external ID "TICKET-238"
already present in row 6.
```

---

# Duplicate Detection Without External ID

Do not automatically assume identical content always means the same feedback.

Text-only duplicate detection can produce false positives.

Recommended V1:

```text
Use externalId for hard duplicate detection when available.
```

If `externalId` is absent, optional exact-content duplicate warnings may be shown as:

```text
possible duplicate
```

rather than a hard duplicate.

Only implement content-based matching if the product explicitly wants it.

---

# Existing Database Duplicate Detection

The current schema includes project-scoped uniqueness for:

```text
projectId + externalId
```

when external IDs are used.

For candidates with a non-empty external ID:

```text
query existing feedback under the trusted organization/project context
```

Then mark matches as duplicates.

Conceptually:

```ts
findExistingFeedbackExternalIds({
  organizationId,
  projectId,
  externalIds,
});
```

Do not query by external ID globally.

---

# Tenant-Safe Duplicate Query

Safe:

```ts
await prisma.feedback.findMany({
  where: {
    organizationId,
    projectId,
    externalId: {
      in: externalIds,
    },
  },
  select: {
    externalId: true,
  },
});
```

Unsafe:

```ts
await prisma.feedback.findMany({
  where: {
    externalId: {
      in: externalIds,
    },
  },
});
```

The duplicate detector must never leak whether another tenant has a matching external ID.

---

# Duplicate Status

Example:

```text
Duplicate
Already exists in this project.
```

or:

```text
Duplicate
Matches row 8 in this file.
```

Keep duplicate reasons actionable and non-sensitive.

---

# Duplicate Handling Policy

For preview, classify duplicates without importing them yet.

Recommended V1 behavior:

```text
valid rows → eligible
invalid rows → blocked
duplicate rows → skipped by default
```

The final import-confirmation feature can decide whether duplicate override is supported.

Recommended V1:

```text
do not allow duplicate override
```

when the duplicate is based on a project-scoped external ID.

This keeps ingestion predictable.

---

# Step 6 — Preview

After mapping and validation, render:

```text
summary
+
preview table
+
filters
+
continue/fix actions
```

---

# Preview Summary

Example:

```text
Import preview

1,248 rows found

1,201 Ready
31 Invalid
16 Duplicates
```

Use status chips consistent with the SignalFlow UI system.

---

# Preview Table

Suggested columns:

```text
Status
Row
Feedback
Source
External ID
Occurred at
Issue
```

Example:

```text
Ready      2   App crashes on login      support   T-1001   Sep 2, 2026   —
Invalid    3   —                         survey    T-1002   Sep 3, 2026   Feedback content is required
Duplicate  4   Slow loading              support   T-998    Sep 1, 2026   Already exists in project
```

---

# Long Feedback Content

Do not let large text destroy table layout.

Use:

```text
truncated preview
```

with:

```text
tooltip / expandable row / detail panel
```

as appropriate.

Preserve full content internally.

---

# Preview Filters

Useful filters:

```text
All
Ready
Invalid
Duplicates
```

Optional:

```text
search by row/content/external ID
```

Do not overbuild filtering before the core preview works.

---

# Invalid Row Detail

Make problems easy to identify.

Example:

```text
Row 27

Feedback content is required.
Occurred at is not a valid date.
```

If possible, highlight affected cells.

---

# Preview Pagination / Virtualization

For large files, do not render thousands of DOM rows at once.

Possible approaches:

```text
pagination
virtualized table
limited preview
```

The exact choice depends on expected file size.

For V1, simple pagination may be sufficient.

Do not prematurely build complex streaming infrastructure without product requirements.

---

# Preview Data Location

Avoid sending unnecessarily huge parsed datasets through multiple client/server round trips.

Choose one controlled preview strategy.

Possible V1 approaches:

## Option A — Client Parse + Server Duplicate Check

```text
Browser parses CSV
Browser validates basic structure
Server receives normalized identifiers for tenant-aware duplicate lookup
Browser renders preview
```

Pros:

- responsive mapping UX

Cons:

- duplicate validation split between client/server
- large payload concerns

## Option B — Server Parse + Temporary Preview State

```text
Upload file
Server parses/validates
Server returns preview result or stores temporary import state
```

Pros:

- one authoritative validator
- easier reuse at confirmation

Cons:

- requires temporary state/file handling

For SignalFlow, server-authoritative validation is preferable for final correctness.

Client-side parsing may still be used for fast UX, but final confirmation must revalidate server-side.

---

# Security Boundary

CSV content is untrusted input.

Treat:

```text
headers
cell values
file name
mapping selections
row IDs
external IDs
dates
```

as untrusted.

Validate at the server boundary before persistence.

---

# CSV Injection / Formula Strings

Feedback content may begin with:

```text
=
+
-
@
```

Do not execute CSV cell contents as formulas.

SignalFlow treats imported values as data.

If data is later exported back to spreadsheet-compatible formats, spreadsheet formula-injection protections should be considered in that export feature.

---

# HTML / Script Content

Feedback may contain markup-like text.

Do not render imported content using unsafe raw HTML.

Render as text by default.

Example content:

```text
<script>alert(1)</script>
```

must appear as feedback text, not execute.

---

# Mapping Security

Client mapping requests must reference only headers actually present in the uploaded/parsed CSV state.

Do not accept arbitrary object/property paths.

---

# Server Validation

Even if the browser already parsed and validated the file, the server must revalidate before permanent import.

Preview is not an authorization or correctness boundary.

The final import feature should use the same canonical validation functions where possible.

---

# Canonical Validation Functions

Prefer reusable pure functions.

Examples:

```ts
normalizeCsvHeader()
suggestColumnMappings()
validateColumnMapping()
transformCsvRow()
validateCandidateFeedback()
detectInFileDuplicates()
```

Tenant-aware duplicate lookup belongs in server/repository code.

---

# Suggested Types

```ts
type CsvHeader = {
  key: string;
  label: string;
};
```

```ts
type ColumnMapping = {
  content: string;
  source?: string;
  externalId?: string;
  customerReference?: string;
  occurredAt?: string;
};
```

```ts
type CandidateFeedback = {
  rowNumber: number;
  content: string;
  source: string | null;
  externalId: string | null;
  customerReference: string | null;
  occurredAt: Date | null;
};
```

```ts
type CsvPreviewRow = {
  rowNumber: number;
  status: "VALID" | "INVALID" | "DUPLICATE";
  feedback: CandidateFeedback;
  errors: string[];
  duplicateReason?: string;
};
```

```ts
type CsvImportPreview = {
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  rows: CsvPreviewRow[];
};
```

---

# Suggested Component Structure

```text
components/
└── feedback-import/
    ├── csv-file-dropzone.tsx
    ├── csv-file-summary.tsx
    ├── column-mapping-form.tsx
    ├── mapping-field.tsx
    ├── import-preview-summary.tsx
    ├── import-preview-table.tsx
    ├── import-preview-filters.tsx
    ├── import-row-status.tsx
    └── import-validation-error.tsx
```

Keep parsing/validation logic outside UI components.

---

# Suggested Server Structure

```text
server/
├── services/
│   └── feedback-import-preview-service.ts
│
├── repositories/
│   └── feedback-repository.ts
│
└── feedback-import/
    ├── csv-parser.ts
    ├── csv-mapping.ts
    ├── csv-validation.ts
    └── duplicate-detection.ts
```

Exact organization can follow the existing repository conventions.

---

# Import Preview Service

Conceptual operation:

```ts
buildCsvImportPreview({
  organizationId,
  projectId,
  file,
  mapping,
});
```

Responsibilities:

```text
verify project access
parse canonical server-side input
validate mapping
transform rows
validate rows
detect duplicates
return preview summary
```

Do not persist final feedback records in this operation.

---

# Authorization Flow

Every server-side preview request:

```text
requireApplicationUser()
      ↓
resolve/verify organization membership
      ↓
verify project belongs to organization
      ↓
process CSV preview
```

The project ID supplied by the browser is never trusted without tenant validation.

---

# File State

If the preview spans multiple screens:

```text
upload
→ mapping
→ preview
```

decide how file state survives navigation.

Possible choices:

```text
keep file in client state for one-page flow
```

or:

```text
temporarily upload/store file and reference a server-controlled preview token
```

Do not store raw CSV contents in localStorage.

For V1, a single-page flow can keep implementation simpler if file-size requirements allow.

---

# UX State — Select File

```text
Import feedback

Drag and drop your CSV here
or choose a file.

[ Choose file ]
```

---

# UX State — Parsing

```text
Reading customer-feedback.csv...
```

Use a spinner/skeleton.

---

# UX State — Mapping

```text
We found 5 columns.

Map the fields you want to import.
```

---

# UX State — Validating

```text
Checking 1,248 rows...
```

Do not invent a numeric progress bar unless real progress is measurable.

---

# UX State — Preview

```text
1,201 rows ready to import
31 invalid
16 duplicates

[ Back to mapping ]    [ Continue ]
```

---

# Continue Button Rules

The user may continue when:

```text
required mappings are valid
AND
at least one valid non-duplicate row exists
```

Recommended:

```text
invalid rows do not necessarily block the whole import
```

if the final import feature supports skipping invalid rows.

If V1 requires all rows to be valid, that policy must be explicit.

Recommended SignalFlow V1:

```text
allow import of valid rows
skip invalid rows
skip duplicates
```

but make the counts clear before confirmation.

---

# Zero Valid Rows

If:

```text
validRows === 0
```

disable Continue.

Example:

```text
No rows are ready to import.

Fix your column mapping or upload a corrected CSV.
```

---

# All Duplicates

If every otherwise-valid row is duplicate:

```text
No new feedback to import.

All valid rows already exist in this project.
```

Disable Continue.

---

# Empty CSV

Example:

```text
This CSV doesn't contain any feedback rows.
```

Return to file selection.

---

# Missing Headers

Example:

```text
We couldn't find a header row in this CSV.
```

---

# Missing Required Mapping

Example:

```text
Map a column to Feedback content before continuing.
```

---

# Invalid Date Example

Preview issue:

```text
Row 42
Occurred at: "tomorrow-ish"

Issue:
Date format is not recognized.
```

Do not silently replace the date with the current date.

---

# Duplicate Examples

## In File

```text
Row 28

Duplicate external ID:
TICKET-900

Matches row 11 in this CSV.
```

## Existing Project

```text
Row 35

Duplicate external ID:
TICKET-122

This feedback already exists in the current project.
```

Never reveal information about matches from another organization/project.

---

# Observability

Log import-preview failures with safe context.

Useful fields:

```text
organizationId
projectId
file size
row count
stage
error code
```

Avoid logging raw feedback content unless there is a specific secure debugging policy.

Customer feedback may contain sensitive information.

---

# Performance

Avoid N+1 duplicate queries.

Bad:

```text
for each row:
  query feedback by externalId
```

Prefer:

```text
collect unique external IDs
      ↓
single batched project-scoped lookup
      ↓
build Set
      ↓
mark duplicates in memory
```

---

# Duplicate Lookup Example

Conceptually:

```ts
const ids = unique(
  candidates
    .map((row) => row.externalId)
    .filter(Boolean)
);

const existing = await findExistingFeedbackExternalIds({
  organizationId,
  projectId,
  externalIds: ids,
});

const existingSet = new Set(existing);
```

Then classify rows deterministically.

---

# Large File Considerations

If row counts become large:

- avoid duplicating the full parsed dataset repeatedly
- avoid excessive React state copies
- batch server requests
- paginate/virtualize preview
- consider server-side parsing
- enforce documented file constraints

Do not prematurely optimize beyond actual V1 needs.

---

# Accessibility

Requirements:

- file input keyboard accessible
- mapping controls have labels
- errors linked to fields
- status not represented by color alone
- table headers semantic
- invalid-row details readable by assistive technology
- focus moves predictably between stages
- destructive/reset actions clearly labeled

---

# Visual Direction

Follow the existing SignalFlow UI:

- dark-only
- near-black base
- dark elevated surfaces
- green primary actions
- subtle borders
- colorful status accents
- dense but readable tables
- Geist typography
- Lucide icons
- shadcn controls

Suggested status usage:

```text
Ready      → green
Invalid    → red
Duplicate  → yellow/orange
```

Keep the main brand green.

---

# Verification Scenarios

## Scenario 1 — Simple Valid CSV

Input:

```csv
id,message,date
1,Great product,2026-09-01
2,App crashes,2026-09-02
```

Mapping:

```text
message → content
id → externalId
date → occurredAt
```

Expected:

```text
2 ready
0 invalid
0 duplicates
```

---

# Scenario 2 — Missing Content

Input:

```csv
id,message
1,Great product
2,
```

Expected:

```text
1 ready
1 invalid
```

Row 2 issue:

```text
Feedback content is required.
```

---

# Scenario 3 — Invalid Date

Input:

```csv
id,message,date
1,Great product,not-a-date
```

Expected:

```text
1 invalid
```

if `date` is mapped to `occurredAt`.

---

# Scenario 4 — In-File Duplicate

Input:

```csv
id,message
100,First message
100,Second message
```

Expected:

```text
first row eligible
second row duplicate
```

based on external ID.

---

# Scenario 5 — Existing Project Duplicate

Existing database:

```text
project A
externalId = 100
```

Uploaded file:

```csv
id,message
100,Existing item
101,New item
```

Expected:

```text
100 → duplicate
101 → ready
```

---

# Scenario 6 — Same External ID in Another Tenant

Organization B has:

```text
externalId = 100
```

Organization A imports:

```text
externalId = 100
```

If Organization A does not already contain it:

```text
row is NOT considered duplicate due to Organization B
```

This verifies tenant isolation.

---

# Scenario 7 — Wrong Mapping

CSV:

```csv
id,message
1,Great product
```

User maps:

```text
id → content
message → externalId
```

Preview should reflect exactly that mapping.

Do not silently override user selection.

The user can go back and correct it.

---

# Scenario 8 — Zero Valid Rows

All rows invalid or duplicate.

Expected:

```text
Continue disabled
```

Show clear explanation.

---

# Testing Strategy

## Parser Tests

```text
parses standard CSV
handles quoted commas
handles escaped quotes
rejects malformed CSV
rejects missing headers
rejects empty file
tracks row numbers
```

## Mapping Tests

```text
suggests common content headers
suggests external ID headers
suggests date headers
requires content mapping
rejects unknown mapped header
rejects duplicate column mapping when disallowed
```

## Transformation Tests

```text
trims strings
turns optional empty string into null
preserves feedback text
parses supported dates
rejects malformed mapped date
```

## Validation Tests

```text
empty content invalid
whitespace content invalid
valid content accepted
optional unmapped fields accepted
```

## Duplicate Tests

```text
same external ID in file detected
existing project external ID detected
same external ID in another tenant ignored
batched lookup used
```

## UI Tests

```text
choose file
→ map fields
→ preview
→ filter invalid
→ return to mapping
```

---

# Definition of Done

- [ ] User can select a CSV file.
- [ ] Non-CSV/invalid files are handled cleanly.
- [ ] CSV parsing returns headers and source row numbers.
- [ ] Detected headers are displayed.
- [ ] Likely mappings are suggested deterministically.
- [ ] User can adjust mappings.
- [ ] Feedback content mapping is required.
- [ ] Rows transform into normalized feedback candidates.
- [ ] Required content is validated.
- [ ] Mapped date values are validated.
- [ ] Invalid rows include actionable error messages.
- [ ] In-file external-ID duplicates are detected.
- [ ] Existing project external-ID duplicates are detected.
- [ ] Duplicate lookup is scoped by organization and project.
- [ ] Duplicate detection does not leak cross-tenant data.
- [ ] Preview summary shows real total/ready/invalid/duplicate counts.
- [ ] Preview table shows row status and mapped values.
- [ ] User can filter preview by status.
- [ ] Continue is disabled when zero rows are importable.
- [ ] Raw CSV cells are rendered safely as text.
- [ ] Server revalidation remains required before final persistence.
- [ ] Loading/error/empty states are implemented.
- [ ] Responsive and keyboard-accessible behavior is implemented.
- [ ] Lint passes.
- [ ] TypeScript passes.
- [ ] Relevant tests pass.
- [ ] Production build passes.
- [ ] `progress-tracker.md` is updated.

---

# Implementation Order

Keep this feature incremental.

## Unit 1 — CSV Parsing

Implement:

```text
select file
parse headers
parse rows
track row numbers
handle parser errors
```

Verify using small fixture files.

Do not implement database insertion.

---

## Unit 2 — Column Mapping

Implement:

```text
header normalization
mapping suggestions
mapping UI
required content mapping
mapping validation
```

Verify manual overrides.

---

## Unit 3 — Row Transformation and Validation

Implement:

```text
candidate transformation
content validation
optional-field normalization
date validation
row-level errors
```

Verify deterministic output.

---

## Unit 4 — In-File Duplicate Detection

Implement:

```text
externalId grouping
duplicate classification
duplicate reason
```

No database query yet.

---

## Unit 5 — Existing Project Duplicate Detection

Implement one batched tenant-scoped lookup:

```text
organizationId
+
projectId
+
externalIds
```

Verify another organization's matching external ID is never considered.

---

## Unit 6 — Preview UI

Implement:

```text
summary cards
preview table
status filters
invalid-row details
duplicate reasons
```

---

## Unit 7 — Continue Readiness

Implement:

```text
valid non-duplicate row count
continue enabled/disabled
back to mapping
```

Stop before final insertion.

---

# Recommended Immediate Coding Unit

Start with:

```text
Unit 1 — CSV Parsing
```

The first completed slice should do only this:

```text
user selects CSV
→ application parses it
→ headers appear
→ row count appears
→ malformed file shows a useful error
```

Once parsing is reliable, add mapping.

Do not build preview tables, duplicate queries, and database insertion all at once.

---

# Relationship to Full Import Flow

This feature ends here:

```text
Upload
→ Map
→ Validate
→ Duplicate Check
→ Preview
```

The next feature should begin at:

```text
Confirm Import
→ create FeedbackImport
→ insert valid feedback
→ store counters/status
→ show result
```

That separation keeps preview logic testable and prevents partially validated files from being persisted.

---

# Next Feature

Recommended next specification:

```text
CSV Import Confirmation & Persistence
```

It should cover:

```text
final server revalidation
FeedbackImport creation
valid-row insertion
duplicate skipping
invalid-row handling
transaction boundaries
counters
status transitions
failure behavior
import result summary
import history
```

AI processing should still remain separate until the import pipeline works end to end.
