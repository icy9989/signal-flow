# Onboarding Flow

## Feature

Guide new SignalFlow users through the minimum setup required to reach their first useful product state:

```text
Workspace Creation
        ↓
Project Creation
        ↓
First Feedback Import
        ↓
Normal Product Experience
```

Onboarding connects the existing workspace, project, and CSV import features into one guided flow. It must reuse their real services, validation, authorization, and persistence logic rather than creating separate onboarding-only implementations.

---

## Goal

A newly authenticated user should not land on an empty or confusing dashboard.

SignalFlow should determine the user's actual setup state and guide them to the next incomplete step:

1. Create or resolve a workspace.
2. Create or resolve a project inside that workspace.
3. Complete the first real CSV feedback import.
4. Enter the normal application.

Onboarding progress must be derived from persisted application data so it survives refreshes and future sessions.

---

## Core Principle

Do not make client-side wizard state the source of truth.

Avoid treating this as authoritative:

```ts
const [step, setStep] = useState(2);
```

Instead derive progress server-side:

```text
Does the user have an accessible organization?
        ↓
Does the active organization have a valid project?
        ↓
Has the active project completed its first accepted import?
        ↓
Onboarding complete
```

The database and trusted server context remain authoritative.

---

## Scope

### In Scope

- Protected onboarding route
- Server-derived onboarding state
- Workspace creation step
- Project creation step
- First feedback import step
- Three-step progress indicator
- Resume after refresh/sign-out/sign-in
- Correct redirects based on durable state
- Active workspace/project context preservation
- Loading, validation, error, retry, and success states
- Tenant isolation
- Responsive SignalFlow UI
- Accessibility
- End-to-end onboarding tests

### Out of Scope

Do not add these as part of onboarding:

- Team invitations
- Member management
- Billing
- Subscription selection
- AI configuration
- Model selection
- Dashboard customization
- Topic configuration
- Product tours across every screen
- Sample/demo feedback generation
- Fake analytics
- Organization settings
- Project settings

Keep onboarding focused on reaching the first real feedback dataset.

---

## Dependencies

```text
Authentication
      ↓
Organization Workspaces
      ↓
Project Management
      ↓
CSV Feedback Import
```

Onboarding orchestrates these features. It does not replace them.

For example:

```text
Workspace onboarding step
→ existing organization creation service

Project onboarding step
→ existing project creation service

First import step
→ real CSV import pipeline
```

Never maintain two implementations of the same business operation.

---

## Onboarding States

Use semantic states:

```ts
type OnboardingStep =
  | "WORKSPACE"
  | "PROJECT"
  | "FIRST_IMPORT"
  | "COMPLETE";
```

The value is derived server-side rather than trusted from the browser.

---

## State Resolution

Recommended resolution:

```text
Authenticated user
      ↓
Resolve local application user
      ↓
Resolve accessible organizations
      ↓
No organization?
      └── WORKSPACE
      ↓
Resolve active organization
      ↓
No project?
      └── PROJECT
      ↓
Resolve active project
      ↓
No successful first import?
      └── FIRST_IMPORT
      ↓
COMPLETE
```

This makes onboarding naturally resumable.

---

## Recommended Resolver

Create a server-only function:

```ts
resolveOnboardingState()
```

Conceptual return type:

```ts
type OnboardingState = {
  step: "WORKSPACE" | "PROJECT" | "FIRST_IMPORT" | "COMPLETE";

  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;

  project: {
    id: string;
    name: string;
  } | null;
};
```

The organization and project returned by this resolver must already be authorized for the current user.

---

# Step 1 — Workspace Creation

## Purpose

The workspace establishes the user's organization context.

Keep the product copy simple:

```text
Step 1 of 3

Create your workspace

Your workspace keeps your projects, customer feedback,
and analysis organized in one place.

Workspace name
[ Acme Inc.                         ]

[ Create workspace ]
```

Do not expose implementation terminology such as multi-tenancy or authorization boundaries in onboarding copy.

---

## Workspace Creation Flow

Reuse the Organization Workspaces feature:

```text
Authenticate
      ↓
Resolve application user
      ↓
Validate workspace name
      ↓
Create Organization
+
Create OWNER membership
atomically
      ↓
Resolve new organization as active
      ↓
Re-resolve onboarding state
      ↓
PROJECT
```

Do not duplicate organization creation logic inside onboarding.

---

## Workspace Completion Rule

The step is complete only when:

```text
Organization exists
AND
authenticated user has valid OrganizationMember access
```

For a newly created workspace, the creator should have:

```text
OWNER
```

A browser-side success flag does not complete the step.

---

## Existing Workspace

If the user already has one or more valid memberships, do not require creation of another workspace.

Resolve the active organization using the normal workspace rules and continue.

---

# Step 2 — Project Creation

## Purpose

A project represents the product or area whose feedback will be analyzed.

Example:

```text
Step 2 of 3

Create your first project

Projects organize feedback for a specific product
or area of your business.

Project name
[ Mobile App                         ]

Description (optional)
[ Customer feedback for our mobile   ]
[ application.                       ]

[ Create project ]
```

---

## Project Creation Flow

Reuse Project Management:

```text
Authenticate
      ↓
Resolve application user
      ↓
Resolve active organization
      ↓
Verify organization membership
      ↓
Validate project input
      ↓
Create project with trusted organizationId
      ↓
Resolve new project as active
      ↓
Re-resolve onboarding state
      ↓
FIRST_IMPORT
```

The browser must not determine project ownership.

---

## Project Completion Rule

The step is complete when:

```text
A valid project exists
AND
project.organizationId === active organization.id
```

If the active organization already has a valid project, do not force the user to create another one.

---

## Multiple Existing Projects

If several projects already exist, use the normal active-project selection rules.

If needed, allow the user to select which authorized project should receive the first import.

Do not create an extra project just because onboarding is active.

---

# Step 3 — First Import

## Purpose

The first import gets real customer feedback into SignalFlow and creates the first useful dataset.

Example:

```text
Step 3 of 3

Import your first feedback

Upload a CSV of customer feedback to start building
your feedback workspace.

[ Choose CSV file ]

[ Continue ]
```

The exact parsing, mapping, validation, preview, confirmation, and persistence behavior belongs to the CSV Feedback Import feature.

---

## First Import Flow

Reuse the real import pipeline:

```text
Select CSV
      ↓
Parse
      ↓
Detect columns
      ↓
Map fields
      ↓
Validate rows
      ↓
Preview
      ↓
Confirm
      ↓
Persist feedback
      ↓
Update import status
      ↓
Complete onboarding
```

Do not build a simplified onboarding-only importer.

---

## First Import Completion Rule

Recommended V1 definition:

```text
At least one import for the active project reaches
the import feature's successful completed state
and valid feedback has been persisted.
```

These do NOT complete onboarding:

```text
file selected
upload started
CSV parsed only in browser
preview displayed
```

Completion must depend on durable server-side success.

---

## Failed Import

A failed import does not reset onboarding.

Keep:

```text
workspace
project
```

and remain on:

```text
FIRST_IMPORT
```

Example:

```text
We couldn't import this file

Review the file issues and try again.

[ Try again ]
```

---

## AI Processing

Recommended separation:

```text
Import successfully persisted
      ↓
Onboarding complete
      ↓
Background AI processing may continue later
```

Do not trap users in onboarding while waiting for AI classification unless the product intentionally changes its activation definition.

---

# Completion

After the first import succeeds:

```text
✓ Workspace
✓ Project
✓ Import
```

Show a short success state:

```text
You're ready to go

Your first customer feedback has been imported
into SignalFlow.

[ View feedback ]
```

Recommended V1 destination:

```text
Feedback Inbox
```

This immediately confirms the real records the user just imported.

---

# Route Strategy

Recommended protected route:

```text
/app/onboarding
```

Server flow:

```text
/app/onboarding
      ↓
requireApplicationUser()
      ↓
resolveOnboardingState()
      ↓
render correct step
```

If state is:

```text
COMPLETE
```

redirect to the normal application.

---

# Normal Application Guard

Normal application entry should recognize incomplete required setup.

Conceptually:

```text
User requests /app/overview
      ↓
Authenticate
      ↓
Resolve required setup context
      ↓
Workspace/project missing?
      ↓
Redirect to /app/onboarding
```

Avoid redirect loops. The onboarding route itself must be allowed to render incomplete setup.

Whether users with a project but no import must always be redirected away from all normal pages is a product decision. At minimum, onboarding should guide them to the first import.

---

# Redirect Rules

```text
Unauthenticated
→ existing authentication flow
```

```text
Authenticated + no workspace
→ /app/onboarding
→ WORKSPACE
```

```text
Workspace + no project
→ /app/onboarding
→ PROJECT
```

```text
Workspace + project + no first successful import
→ /app/onboarding
→ FIRST_IMPORT
```

```text
Workspace + project + first import complete
→ normal application
```

---

# Resume Behavior

## Refresh After Workspace Creation

Persisted state:

```text
Workspace exists
No project
```

Expected:

```text
PROJECT
```

Do not return to workspace creation.

## Refresh After Project Creation

Persisted state:

```text
Workspace exists
Project exists
No successful import
```

Expected:

```text
FIRST_IMPORT
```

## Returning Activated User

Persisted state:

```text
Workspace
Project
Successful import
```

Expected:

```text
COMPLETE
```

Do not replay onboarding.

---

# Progress Indicator

Use a compact three-step indicator:

```text
1 Workspace  ───  2 Project  ───  3 Import
```

Example current state:

```text
✓ Workspace  ───  ● Project  ───  3 Import
```

The indicator is informational.

It must not allow users to bypass required server state.

---

# Navigation Rules

Do not permit arbitrary forward skipping.

A user with no workspace cannot jump directly to:

```text
Import
```

because the import requires valid organization and project ownership.

Completed durable steps should not behave like reversible temporary wizard state.

Example:

```text
Workspace created
→ Project step
```

Going backward must not silently delete the workspace.

---

# UI Direction

Follow the SignalFlow visual system:

- dark-only UI
- near-black page background
- elevated dark card
- green primary CTA
- subtle borders
- Geist typography
- Lucide icons
- shadcn primitives
- compact professional SaaS layout

The onboarding screen should be calmer than the analytics dashboard.

Do not show fake charts or metrics before real data exists.

---

# Suggested Desktop Layout

```text
┌───────────────────────────────────────────────────────┐
│ SignalFlow                                            │
│                                                       │
│       ✓ Workspace ─── ● Project ─── 3 Import          │
│                                                       │
│       ┌───────────────────────────────────────┐       │
│       │ Create your first project             │       │
│       │                                       │       │
│       │ Project name                          │       │
│       │ [ Mobile App                      ]   │       │
│       │                                       │       │
│       │ Description                           │       │
│       │ [                                 ]   │       │
│       │                                       │       │
│       │                    [ Create project ] │       │
│       └───────────────────────────────────────┘       │
│                                                       │
└───────────────────────────────────────────────────────┘
```

Use a focused central setup card rather than the full dashboard layout.

---

# Responsive Behavior

Mobile:

```text
SignalFlow

✓ Workspace
● Project
3 Import

Create your first project

[ Project name              ]

[ Description               ]

[ Create project            ]
```

Requirements:

- no horizontal overflow
- full-width controls where appropriate
- clear progress state
- comfortable touch targets
- no hover-only information
- validation errors close to inputs

---

# Suggested Components

```text
components/
└── onboarding/
    ├── onboarding-shell.tsx
    ├── onboarding-progress.tsx
    ├── workspace-step.tsx
    ├── project-step.tsx
    ├── first-import-step.tsx
    └── onboarding-complete.tsx
```

Prefer reusing existing feature components:

```text
workspace-step
→ CreateWorkspaceForm
```

```text
project-step
→ CreateProjectForm
```

```text
first-import-step
→ CSV import components
```

Avoid duplicate forms and duplicate business rules.

---

# Suggested Server Structure

```text
server/
├── onboarding/
│   └── resolve-onboarding-state.ts
│
├── auth/
├── services/
│   ├── organization-service.ts
│   ├── project-service.ts
│   └── feedback-import-service.ts
│
└── repositories/
```

The onboarding resolver coordinates existing boundaries. It should not become a giant business-logic module.

---

# Server Component Strategy

Prefer Server Components for:

- resolving onboarding state
- choosing the step to render
- loading authorized organization/project context
- redirecting completed users

Use Client Components only where browser interaction is required:

- forms
- file selection
- CSV mapping
- dialogs
- upload progress

Do not make the entire onboarding route a Client Component.

---

# Resolver Pseudocode

```ts
export async function resolveOnboardingState() {
  const user = await requireApplicationUser();

  const organization =
    await resolveActiveOrganizationForUser(user.id);

  if (!organization) {
    return {
      step: "WORKSPACE",
      organization: null,
      project: null,
    };
  }

  const project = await resolveActiveProject({
    userId: user.id,
    organizationId: organization.id,
  });

  if (!project) {
    return {
      step: "PROJECT",
      organization,
      project: null,
    };
  }

  const hasCompletedImport = await hasCompletedFirstImport({
    organizationId: organization.id,
    projectId: project.id,
  });

  if (!hasCompletedImport) {
    return {
      step: "FIRST_IMPORT",
      organization,
      project,
    };
  }

  return {
    step: "COMPLETE",
    organization,
    project,
  };
}
```

Exact names should follow the repository's conventions.

---

# Tenant Isolation

Onboarding must preserve the same tenant boundaries as the normal application.

Never weaken authorization because a route is named:

```text
/onboarding
```

Project resolution must verify:

```text
organizationId + projectId
```

Import operations must carry trusted:

```text
organizationId + projectId
```

and scope database operations accordingly.

---

# Client Input Rules

Never trust browser-supplied:

```text
userId
organizationId
organization role
project ownership
import ownership
onboardingComplete
onboardingStep
```

The browser requests actions.

The server determines authority and current state.

---

# Security Invariants

1. Onboarding never bypasses authentication.
2. Workspace creation uses the same atomic Organization + OWNER membership logic as the workspace feature.
3. Project creation uses a verified organization context.
4. First import uses verified organization and project contexts.
5. Client-provided onboarding state is never authoritative.
6. Users cannot skip into tenant-owned steps without required persisted parent resources.
7. Cross-tenant resources never satisfy onboarding state.
8. Failed later steps do not destroy completed durable resources.
9. Stored active workspace/project preferences are revalidated.
10. Completion is based on real persisted data rather than UI state.

---

# Error Handling

Errors should stay local to the current step.

## Workspace Failure

```text
We couldn't create your workspace.
Please try again.
```

Remain on:

```text
WORKSPACE
```

## Project Failure

```text
We couldn't create your project.
Please try again.
```

Keep the workspace and remain on:

```text
PROJECT
```

## Import Failure

```text
We couldn't import this file.
Review the file issues and try again.
```

Keep workspace/project and remain on:

```text
FIRST_IMPORT
```

---

# Retry Behavior

Avoid duplicate resources caused by:

- double-clicks
- network retries
- form resubmission
- refreshes

At minimum:

- disable submit while pending
- use database uniqueness constraints
- translate conflicts into stable application errors
- re-resolve persisted state after mutations

---

# Loading States

Initial resolution:

```text
focused onboarding skeleton
```

Mutation:

```text
button pending state
```

Import:

```text
real upload / parse / validation / persistence status
```

Do not display fake progress percentages.

---

# Accessibility

Requirements:

- semantic headings
- explicit labels
- keyboard-accessible controls
- visible focus states
- accessible progress semantics
- errors associated with fields
- status updates announced where appropriate
- do not use color as the only progress signal

---

# Verification Scenarios

## Scenario 1 — Brand-New User

```text
No workspace
No project
No import
```

Expected:

```text
WORKSPACE
→ create workspace
→ PROJECT
→ create project
→ FIRST_IMPORT
→ successful import
→ COMPLETE
→ normal app
```

## Scenario 2 — Existing Workspace

```text
Workspace exists
No project
```

Expected:

```text
PROJECT
```

## Scenario 3 — Existing Project

```text
Workspace exists
Project exists
No successful import
```

Expected:

```text
FIRST_IMPORT
```

## Scenario 4 — Failed Import

```text
Workspace exists
Project exists
Import fails
```

Expected:

```text
FIRST_IMPORT
```

Workspace/project remain intact.

## Scenario 5 — Activated User

```text
Workspace exists
Project exists
Successful import exists
```

Expected:

```text
COMPLETE
```

## Scenario 6 — Invalid Stored Workspace

If the stored active organization is no longer accessible:

```text
reject preference
→ resolve another valid membership
→ or WORKSPACE if none exists
```

Never expose inaccessible tenant data.

## Scenario 7 — Invalid Stored Project

If the stored project does not belong to the active organization:

```text
reject preference
→ resolve valid project
→ or PROJECT if none exists
```

## Scenario 8 — Cross-Tenant Manipulation

Manually supplied IDs for another tenant must be denied.

No private organization, project, import, or feedback data may be exposed.

---

# Suggested Tests

## Resolver

```text
no organization → WORKSPACE
organization + no project → PROJECT
organization + project + no completed import → FIRST_IMPORT
organization + project + completed import → COMPLETE
```

Also:

```text
invalid active organization → safe resolution
invalid active project → safe resolution
```

## Integration

```text
create workspace
→ OWNER membership exists
→ resolver returns PROJECT
```

```text
create project
→ belongs to active organization
→ resolver returns FIRST_IMPORT
```

```text
complete first import
→ feedback persisted
→ resolver returns COMPLETE
```

## Tenant Isolation

```text
User A cannot use Organization B
User A cannot use Project B
User A cannot satisfy completion with another tenant's import
```

## End-to-End UI

```text
sign in
→ onboarding
→ create workspace
→ create project
→ upload valid CSV
→ validate
→ confirm
→ import succeeds
→ completion
→ view feedback
```

---

# Definition of Done

- [ ] New authenticated user enters onboarding when required.
- [ ] Onboarding state is derived server-side from persisted data.
- [ ] Client wizard state is not authoritative.
- [ ] No-workspace user sees Workspace step.
- [ ] Workspace step reuses existing organization creation logic.
- [ ] Workspace creation establishes valid OWNER membership.
- [ ] Workspace-without-project user sees Project step.
- [ ] Project step reuses Project Management logic.
- [ ] Project is created only under an authorized organization.
- [ ] Workspace/project-without-import user sees First Import step.
- [ ] First Import reuses the real CSV import pipeline.
- [ ] Failed imports preserve workspace/project progress.
- [ ] Successful persisted first import completes onboarding.
- [ ] Completed users enter the normal application.
- [ ] Refresh resumes at the correct step.
- [ ] Sign-out/sign-in resumes from durable state.
- [ ] Invalid active workspace/project preferences fail safely.
- [ ] Forward skipping cannot bypass authorization.
- [ ] Cross-tenant resources cannot satisfy onboarding.
- [ ] Responsive desktop/mobile UI is implemented.
- [ ] Keyboard/focus/accessibility basics are implemented.
- [ ] Loading, validation, error, retry, and success states exist.
- [ ] No fake projects, feedback, metrics, or analytics are generated.
- [ ] Lint passes.
- [ ] TypeScript passes.
- [ ] Relevant tests pass.
- [ ] Production build passes.
- [ ] `progress-tracker.md` is updated.

---

# Implementation Order

Keep onboarding incremental.

## Unit 1 — Onboarding State Resolver

Implement:

```text
resolveOnboardingState()
```

Verify server-derived transitions:

```text
WORKSPACE
PROJECT
FIRST_IMPORT
COMPLETE
```

## Unit 2 — Workspace Step Integration

Reuse Organization Workspaces.

Verify:

```text
no workspace
→ create workspace
→ OWNER membership
→ active workspace
→ PROJECT
```

## Unit 3 — Project Step Integration

Reuse Project Management.

Verify:

```text
workspace
→ create project
→ correct organization ownership
→ active project
→ FIRST_IMPORT
```

## Unit 4 — First Import Integration

After the CSV Feedback Import feature works independently, connect it to onboarding.

Verify:

```text
valid import
→ persisted feedback
→ completed import
→ COMPLETE
```

Do not build a temporary fake importer.

## Unit 5 — Resume and Redirect Rules

Verify:

```text
refresh
sign out/in
direct URLs
stale preferences
completed users
```

## Unit 6 — End-to-End Verification

Test:

```text
new user
→ workspace
→ project
→ first import
→ normal product
```

Then test failures and tenant manipulation.

---

# Sequencing Note

Because the onboarding flow ends with the first import, implementation can happen in two stages.

## Stage A

After Organization Workspaces and Project Management:

```text
onboarding shell
state resolver
workspace integration
project integration
```

## Stage B

After CSV Feedback Import:

```text
first-import integration
completion detection
final redirect
```

Do not duplicate CSV ingestion logic just to finish onboarding earlier.

---

# Open Product Decisions

1. Should completion mean first successfully persisted import or completed AI processing?

   Recommended V1: first successfully persisted import.

2. Where should onboarding land after completion?

   Recommended V1: Feedback Inbox.

3. If multiple projects already exist, should the user explicitly choose the project for the first import?

4. Should newly created secondary workspaces use the full onboarding experience or a shorter workspace setup flow?

5. Should completed progress steps be clickable?

6. Can users skip the first import?

   Recommended V1: do not skip the core activation flow if the normal experience depends on feedback data.

---

# Recommended Immediate Coding Unit

Start with:

```text
Unit 1 — Onboarding State Resolver
```

Do not begin by building three independent wizard screens.

First make the server reliably answer:

```text
Does the user need a workspace?
Does the workspace need a project?
Does the project need its first import?
Is onboarding complete?
```

Once this is correct, the UI becomes a thin representation of trusted application state.

---

# Feature Sequence

```text
Authentication
      ↓
Organization Workspaces
      ↓
Project Management
      ↓
CSV Feedback Import
      ↓
Complete Onboarding Integration
      ↓
Feedback Inbox
      ↓
AI Classification
      ↓
Background Processing
      ↓
Dashboard Analytics
```

---

# Next Feature

The next core data feature is:

```text
CSV Feedback Import
```

Its specification should cover:

```text
file selection
CSV parsing
column detection
column mapping
row validation
preview
confirmation
database insertion
import status
import history
tenant isolation
```

Once CSV import works independently, connect that same implementation to the onboarding `FIRST_IMPORT` step.
