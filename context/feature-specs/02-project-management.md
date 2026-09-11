# Project Management

## Feature

Create, list, and select projects inside an organization workspace.

This feature builds on the completed organization workspace foundation and establishes the project boundary used by future feedback imports, analytics, topics, insights, and AI processing.

The feature includes:

1. Create a project inside the active organization.
2. List projects belonging to the active organization.
3. Select and resolve the active project.
4. Enforce organization-scoped access for every project operation.
5. Prevent cross-workspace project access.
6. Provide clean empty, loading, validation, and error states.

---

# Goal

After a user enters an authorized organization workspace, they should be able to create and work within projects that belong only to that workspace.

The required flow is:

```text
Authenticated User
      ↓
Resolve Local Application User
      ↓
Resolve Active Organization
      ↓
Verify Organization Membership
      ↓
List Organization Projects
      ↓
Create / Select Project
      ↓
Trusted Project Context
      ↓
Project-Scoped Features
```

At the end of this feature, SignalFlow should be ready to begin the CSV feedback import feature.

---

# Scope

## In Scope

- Create project
- Validate project input
- List projects for active organization
- Project empty state
- Project selector
- Active project resolution
- Project access authorization
- Organization-scoped project queries
- Cross-tenant isolation checks
- Project-specific loading and error states
- Tests for project creation and isolation

## Out of Scope

Do not implement these as part of this feature:

- CSV upload
- Feedback import
- Feedback inbox
- AI processing
- Embeddings
- Topics
- Analytics
- Insights
- Team invitations
- Project-level roles
- Project deletion
- Project archival
- Project duplication
- Project transfer between organizations
- Project settings beyond basic name/description

Those should be implemented as separate features.

---

# Existing Foundation

This feature assumes the following already work:

- Clerk authentication
- `requireApplicationUser()`
- Organization creation
- Organization owner membership
- `requireOrganizationMembership()`
- Active organization resolution
- Workspace selector
- PostgreSQL
- Prisma
- `User`
- `Organization`
- `OrganizationMember`
- `Project`

The organization workspace remains the primary tenant boundary.

Project authorization must always begin from a verified organization context.

---

# Data Model

The existing `Project` model is the source of truth.

Conceptually:

```text
Project
------
id
organizationId
name
description
createdAt
updatedAt
```

Relationship:

```text
Organization
    1
    ↓
    *
Project
```

A project belongs to exactly one organization.

A project must never be treated as globally accessible simply because its project ID is known.

---

# Existing Project Constraints

The current schema already defines project ownership under an organization.

The important rules are:

```text
organizationId is required
```

and:

```text
organizationId + name
```

is unique.

This means two separate organizations may use the same project name.

Example:

```text
Organization A
  → Product Feedback

Organization B
  → Product Feedback
```

This is valid.

Within the same organization:

```text
Product Feedback
Product Feedback
```

should not be allowed.

---

# Product Behavior

## 1. Workspace Has No Projects

When the active organization contains no projects, show a truthful empty state.

Example:

```text
No projects yet

Create your first project to start organizing
customer feedback.

[ Create Project ]
```

Do not create a default project automatically.

The first project should be an explicit user action.

---

# 2. Create Project

The minimum V1 form contains:

```text
Project name
Description (optional)
```

Example:

```text
Project name
[ Mobile App                         ]

Description
[ Customer feedback for the mobile  ]
[ application.                      ]

                    [Cancel] [Create project]
```

The project must always be created inside the already verified active organization.

The browser must not be trusted to decide project ownership.

---

# Project Creation Flow

```text
User clicks Create Project
      ↓
Open form
      ↓
Submit name + optional description
      ↓
Server authenticates user
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
Navigate to project workspace
```

---

# Server-Side Creation

The organization ID used when creating the project must come from trusted server context.

Preferred conceptual flow:

```ts
const user = await requireApplicationUser();

const organizationContext =
  await requireOrganizationMembership({
    organizationId: activeOrganizationId,
  });

const input = CreateProjectSchema.parse(formData);

const project = await createProject({
  organizationId: organizationContext.organization.id,
  name: input.name,
  description: input.description,
});
```

Do not accept this as trusted client authority:

```json
{
  "organizationId": "org_xyz"
}
```

Even if an organization ID is submitted by the browser, the server must independently verify membership before using it.

---

# Project Validation

Validate project creation at the server boundary.

Conceptually:

```ts
const CreateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required"),

  description: z
    .string()
    .trim()
    .optional(),
});
```

Do not invent permanent product limits unless they are intentionally defined.

If maximum lengths are needed later, add them as an explicit product decision.

---

# Duplicate Project Names

Because the schema enforces uniqueness by:

```text
organizationId + name
```

the service should provide a friendly conflict response.

Example:

```text
A project with this name already exists in this workspace.
```

Do not expose a raw Prisma/database uniqueness error.

Recommended application error:

```text
409
PROJECT_NAME_CONFLICT
```

---

# Project Listing

Projects must be listed only for the verified active organization.

Conceptually:

```ts
const projects = await prisma.project.findMany({
  where: {
    organizationId,
  },
  orderBy: {
    createdAt: "desc",
  },
});
```

Do not:

```ts
prisma.project.findMany()
```

and then filter projects in the browser.

Tenant filtering belongs in the database query.

---

# List Project Fields

For the initial selector/list UI, load only what is needed.

Example:

```text
id
name
description
createdAt
updatedAt
```

Do not eagerly load:

- feedback
- imports
- topics
- insights
- embeddings

unless the page specifically requires them.

Keep project listing lightweight.

---

# Active Project

## Purpose

Many future SignalFlow features will operate within one selected project.

Examples:

```text
Feedback
Topics
Analytics
Insights
Imports
```

The application therefore needs an active project context.

The active project must always belong to the active organization.

---

# Active Project Resolution

Use this behavior:

## Zero Projects

```text
projects.length === 0
```

Result:

```text
Show project empty state
```

No project-owned data should be queried.

---

## One Project

```text
projects.length === 1
```

Result:

```text
Use that project automatically.
```

The user should not need to make an unnecessary selection.

---

## Multiple Projects

```text
projects.length > 1
```

Result:

```text
Resolve the previously selected project when valid.

Otherwise select a safe default or require the user
to choose a project.
```

Any stored project selection is only a preference.

It is not authorization.

---

# Project Selection Validation

When the user requests:

```text
Switch to Project X
```

the server must verify:

```text
Project X belongs to active Organization Y
```

before accepting the selection.

Conceptually:

```ts
const project = await prisma.project.findFirst({
  where: {
    id: projectId,
    organizationId,
  },
});
```

If no project is returned, fail closed.

Do not first fetch by:

```text
projectId only
```

and later inspect ownership.

Scope the lookup at query time whenever possible.

---

# Trusted Project Context

A useful server-only context shape is:

```ts
type ProjectContext = {
  organization: {
    id: string;
    name: string;
    slug: string;
  };

  membership: {
    id: string;
    role: OrganizationRole;
  };

  project: {
    id: string;
    name: string;
    description: string | null;
  };

  user: {
    id: string;
  };
};
```

Only trusted server code should construct this context.

Do not accept a complete `ProjectContext` from the browser.

---

# Recommended Project Authorization Helper

Add a centralized project resolver.

Conceptually:

```ts
requireProjectAccess({
  organizationId,
  projectId,
});
```

Its responsibility:

```text
authenticate
      ↓
resolve application user
      ↓
verify organization membership
      ↓
query project by:
  projectId
  + organizationId
      ↓
return trusted project context
```

The helper should fail closed.

---

# Repository Contracts

Make tenant scope explicit in repository signatures.

Prefer:

```ts
createProject({
  organizationId,
  name,
  description,
});
```

Prefer:

```ts
listProjects({
  organizationId,
});
```

Prefer:

```ts
getProject({
  organizationId,
  projectId,
});
```

Avoid:

```ts
getProject(projectId);
```

Avoid:

```ts
listProjects();
```

This keeps organization isolation visible in the API contract.

---

# Service Responsibilities

Recommended project service operations:

```text
createProject()
listProjects()
getProject()
resolveActiveProject()
switchActiveProject()
```

Business logic belongs in the service layer.

Database details belong in repositories.

UI components should not implement authorization rules.

---

# Suggested Server Structure

Follow the existing SignalFlow architecture.

```text
src/
├── app/
│   └── app/
│       └── ...
│
├── server/
│   ├── auth/
│   │   ├── require-application-user.ts
│   │   ├── organization-context.ts
│   │   └── project-context.ts
│   │
│   ├── services/
│   │   └── project-service.ts
│   │
│   └── repositories/
│       └── project-repository.ts
│
├── components/
│   └── project/
│       ├── create-project-form.tsx
│       ├── project-selector.tsx
│       ├── project-card.tsx
│       └── project-empty-state.tsx
│
└── lib/
    └── validation/
        └── project.ts
```

Exact filenames may follow the current repository organization.

Do not introduce unnecessary abstraction layers.

---

# Project Selector UI

The active project should be clearly visible inside the current workspace.

Possible sidebar structure:

```text
┌────────────────────────────┐
│ SignalFlow                 │
│                            │
│ Acme Inc.               ▾  │
│                            │
│ Project                    │
│ Mobile App              ▾  │
│                            │
│ Overview                   │
│ Feedback                   │
│ Topics                     │
│ Insights                   │
└────────────────────────────┘
```

Selector menu:

```text
Mobile App                ✓
Web App
Developer Platform

────────────────────────────
Create project
```

Only projects belonging to the active organization may appear.

---

# Workspace and Project Relationship in UI

Workspace and project selection must remain visually distinct.

Recommended hierarchy:

```text
Workspace
  ↓
Project
  ↓
Project Feature
```

Example:

```text
Acme Inc.
  └── Mobile App
      ├── Overview
      ├── Feedback
      ├── Topics
      └── Insights
```

This helps users understand which tenant and project they are currently viewing.

---

# Create Project UI

Use the existing SignalFlow design system:

- dark background
- elevated near-black surface
- subtle border
- green primary CTA
- muted helper copy
- strong focus state
- compact spacing
- accessible labels
- clear validation messages

Example:

```text
Create project

Projects keep customer feedback and analysis
organized inside this workspace.

Project name
[ Mobile App                         ]

Description
[ Customer feedback for the mobile  ]
[ product.                          ]

                    [Cancel] [Create project]
```

---

# Project List UI

If a dedicated project list page is used, it should remain simple.

Example:

```text
Projects

Manage the products or areas you analyze
inside this workspace.

[ + Create Project ]

┌──────────────────────────────┐
│ Mobile App                   │
│ Customer feedback for iOS    │
│ and Android.                 │
│                              │
│ Updated recently             │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Web App                      │
│ Website customer feedback.   │
│                              │
│ Updated recently             │
└──────────────────────────────┘
```

Avoid adding fake metrics such as:

```text
1,245 feedback items
87% positive
12 insights
```

unless those values actually exist and are computed from real data.

---

# Server Component Usage

Prefer React Server Components for:

- loading projects
- resolving active project
- rendering initial project list
- rendering project-owned page data

Use small Client Components only for:

- project selector interaction
- create-project dialog interaction
- form state where needed

Do not convert the entire application shell to a Client Component just to support project switching.

---

# Project Request Flow

Normal project-owned route:

```text
Browser
   ↓
Protected route
   ↓
requireApplicationUser()
   ↓
resolveActiveOrganization()
   ↓
verify organization membership
   ↓
resolveActiveProject()
   ↓
verify project.organizationId === active organization
   ↓
trusted project context
   ↓
project-scoped service
   ↓
project + organization scoped repository query
   ↓
PostgreSQL
```

---

# Project Creation Flow

```text
User opens active workspace
      ↓
No project / project list
      ↓
Create Project
      ↓
Submit form
      ↓
Authenticate
      ↓
Resolve local user
      ↓
Resolve active organization
      ↓
Verify membership
      ↓
Validate project input
      ↓
Create Project with trusted organizationId
      ↓
Resolve project as active
      ↓
Navigate to project overview
```

---

# Project Switching Flow

```text
User selects project
      ↓
Send requested project identifier
      ↓
Authenticate
      ↓
Resolve active organization
      ↓
Verify organization membership
      ↓
Query project by:
  id + organizationId
      ↓
Persist active-project preference
      ↓
Refresh project-owned UI
```

Client-side visual state alone must never establish project access.

---

# Active Project Persistence

The project specification should use the same general strategy as active organization selection.

Possible V1 approaches:

```text
server-managed cookie
```

or:

```text
route segment
```

or another server-controlled preference.

Regardless of mechanism:

```text
stored project identifier
      ↓
treat as untrusted
      ↓
resolve active organization
      ↓
verify project belongs to organization
      ↓
only then trust project context
```

---

# Route Strategy

Two reasonable approaches exist.

## Option A — Server-Managed Active Project

Example routes:

```text
/app/overview
/app/feedback
/app/topics
```

The server resolves the active organization and active project from trusted preferences.

Advantages:

- cleaner URLs
- simpler navigation

Tradeoff:

- project context is less visible in the URL

---

## Option B — Project in Route

Example:

```text
/app/projects/[projectId]/overview
/app/projects/[projectId]/feedback
```

The server still must verify:

```text
projectId + organizationId
```

Advantages:

- direct project URLs
- easier deep linking

Tradeoff:

- more route complexity

Do not treat the route parameter as authorization.

---

# Security Invariants

These are non-negotiable.

## Invariant 1

A project always belongs to exactly one organization.

## Invariant 2

A user cannot access a project unless they are authorized for the owning organization.

## Invariant 3

A project lookup must be scoped to organization ownership.

## Invariant 4

The active project preference is never authorization.

## Invariant 5

A browser cannot choose an arbitrary organization when creating a project.

## Invariant 6

A browser cannot switch to a project in another workspace.

## Invariant 7

Project-owned data must later include both organization and project context where appropriate.

## Invariant 8

Cross-tenant project errors must not expose private workspace data.

---

# Tenant Isolation

Project isolation builds directly on organization isolation.

A safe project query uses:

```text
organizationId
+
projectId
```

Example:

```ts
await prisma.project.findFirst({
  where: {
    id: projectId,
    organizationId,
  },
});
```

Unsafe pattern:

```ts
await prisma.project.findUnique({
  where: {
    id: projectId,
  },
});
```

when the result is immediately used as trusted tenant-owned data without checking organization membership and ownership.

---

# Future Resource Scoping

Once later features are added, project-owned queries should continue to include tenant scope.

Examples:

```ts
feedback.findMany({
  where: {
    organizationId,
    projectId,
  },
});
```

```ts
feedbackImport.findMany({
  where: {
    organizationId,
    projectId,
  },
});
```

```ts
topic.findMany({
  where: {
    organizationId,
    projectId,
  },
});
```

```ts
insight.findMany({
  where: {
    organizationId,
    projectId,
  },
});
```

This feature should establish the pattern before those resources are implemented.

---

# Authorization by Role

For basic project creation, define the required role explicitly.

A reasonable V1 rule is:

```text
OWNER → can create project
ADMIN → can create project
MEMBER → product decision
```

Do not silently assume the `MEMBER` permission.

If the project has not yet defined this rule, document it as an open decision.

Project listing and selecting generally require only valid organization membership.

---

# Error Behavior

Use predictable application errors.

## Unauthenticated

```text
401
```

or existing authentication redirect behavior.

---

## Organization Not Accessible

Fail using the organization's authorization policy.

Do not continue to project queries.

---

## Invalid Project Input

```text
400
VALIDATION_ERROR
```

Example:

```text
Enter a project name.
```

---

## Project Name Conflict

```text
409
PROJECT_NAME_CONFLICT
```

User-facing message:

```text
A project with this name already exists in this workspace.
```

---

## Project Not Accessible

Prefer a non-leaking response.

Example:

```text
404
PROJECT_NOT_FOUND
```

This avoids telling a user that a project exists in another organization.

---

## Unexpected Failure

```text
500
```

Log server-side details.

Do not expose:

- stack traces
- database details
- raw Prisma errors
- tenant identifiers not intended for the user

---

# Loading States

Use simple skeletons or compact loading states.

Examples:

```text
Loading projects...
```

or project-card skeletons.

Avoid excessive full-screen loading when only one small project section is changing.

---

# Empty States

## No Projects

```text
No projects yet

Create your first project to organize customer
feedback inside this workspace.

[ Create Project ]
```

---

# Success States

After successful creation:

```text
Project created
```

Then:

- close form/dialog
- refresh server data
- make the new project active
- navigate to project overview if applicable

Avoid optimistic UI that shows a project before the server confirms creation unless the implementation safely handles rollback.

---

# Suggested Repository Functions

```ts
createProject({
  organizationId,
  name,
  description,
});
```

```ts
listProjects({
  organizationId,
});
```

```ts
getProject({
  organizationId,
  projectId,
});
```

Optionally:

```ts
projectNameExists({
  organizationId,
  name,
});
```

Do not create more repository methods than the feature requires.

---

# Suggested Service Functions

```ts
createProjectForOrganization({
  userId,
  organizationId,
  input,
});
```

```ts
listProjectsForOrganization({
  organizationId,
});
```

```ts
resolveActiveProject({
  organizationId,
  projectIdPreference,
});
```

```ts
switchActiveProject({
  organizationId,
  projectId,
});
```

The exact function signatures should follow the current codebase style.

---

# Testing Strategy

Prioritize server-side authorization and tenant isolation.

## Project Creation

Verify:

- authorized user can create a project
- created project has the correct organizationId
- project name is required
- optional description persists correctly
- duplicate name in same organization is rejected
- same project name in a different organization is allowed
- user cannot create a project in an unauthorized organization

---

# Project Listing

Verify:

- project list contains only active organization projects
- projects from another organization never appear
- empty organization returns an empty list
- query is scoped by organizationId

---

# Project Selection

Verify:

- user can select project in active organization
- selecting a project outside active organization fails
- stale project selection is ignored or safely rejected
- one project can auto-resolve
- zero projects shows empty state
- multiple projects support switching

---

# Cross-Tenant Test

Create:

```text
User A
Organization A
Project A

User B
Organization B
Project B
```

Verify:

```text
User A
→ Organization A
→ Project A
allowed
```

```text
User B
→ Organization B
→ Project B
allowed
```

Verify denied:

```text
User A
→ Project B
```

```text
User B
→ Project A
```

Also verify:

```text
Project B ID manually inserted into User A request
```

still fails because the query includes:

```text
organizationId = Organization A
```

---

# Suggested Tests

Examples:

```text
createProject creates project in correct organization
createProject rejects unauthorized organization
createProject rejects duplicate name in same organization
createProject allows same name in separate organizations
listProjects returns only organization-owned projects
getProject requires organization scope
resolveActiveProject accepts valid project
resolveActiveProject rejects cross-tenant project
switchActiveProject rejects project outside active organization
```

Browser/UI test:

```text
sign in
→ enter workspace
→ no projects
→ create project
→ project appears
→ project becomes active
→ selector shows project
```

For multiple projects:

```text
create project A
→ create project B
→ switch A
→ switch B
→ project-owned UI follows selected project
```

---

# Definition of Done

The Project Management feature is complete when:

- [ ] User can create a project inside an authorized workspace.
- [ ] Project input is validated server-side.
- [ ] Project receives organizationId from trusted server context.
- [ ] Browser-supplied organization ownership is never trusted.
- [ ] Duplicate project names inside one organization are handled cleanly.
- [ ] Same project name can exist in different organizations.
- [ ] Active organization project list is rendered.
- [ ] Project queries are scoped by organizationId.
- [ ] Empty workspace shows a project empty state.
- [ ] One project can resolve automatically.
- [ ] Multiple projects can be selected.
- [ ] Active project preference is revalidated on the server.
- [ ] Cross-workspace project access is denied.
- [ ] Unauthorized project requests do not leak tenant information.
- [ ] Loading, empty, validation, conflict, and error states are implemented.
- [ ] Project selector follows the SignalFlow dark/green UI system.
- [ ] Lint passes.
- [ ] TypeScript passes.
- [ ] Relevant tests pass.
- [ ] Production build passes.
- [ ] `progress-tracker.md` is updated.

---

# Implementation Order

Keep this feature incremental.

## Unit 1 — Project Authorization Foundation

Implement:

```text
getProject({
  organizationId,
  projectId,
})

requireProjectAccess()
```

Verify:

```text
same organization → allowed
different organization → denied
```

Do not build CSV import yet.

---

## Unit 2 — List Projects

Implement:

```text
listProjects({
  organizationId,
})
```

Then render:

```text
loading
empty
project list
error
```

Verify no cross-workspace projects appear.

---

## Unit 3 — Create Project

Implement:

```text
form
validation
role check
organization-scoped creation
duplicate-name handling
```

After success:

```text
refresh list
select new project
```

---

## Unit 4 — Active Project Resolution

Implement:

```text
0 projects → empty state
1 project → auto resolve
multiple projects → resolve valid preference
invalid/stale preference → safe fallback
```

---

## Unit 5 — Project Selector

Implement the project selector in the application shell.

Verify:

```text
only active organization projects appear
```

and:

```text
cross-organization project selection is rejected
```

---

## Unit 6 — Tenant Isolation Verification

Run explicit cross-tenant tests.

Only after the project boundary is verified should the next feature begin:

```text
CSV Feedback Import
```

---

# Open Product Decisions

Resolve these explicitly instead of inventing them during implementation.

1. Can `MEMBER` users create projects?
2. Maximum project-name length.
3. Maximum description length.
4. Exact active-project persistence mechanism.
5. Whether project ID appears in the URL.
6. Whether project names are editable in V1.
7. Whether project deletion is supported in V1.
8. Whether projects can be archived.
9. Whether a workspace must always contain at least one project.

These decisions do not block the basic authorization foundation.

---

# Recommended Immediate Next Coding Unit

Start with:

```text
Unit 1 — Project Authorization Foundation
```

Specifically:

```ts
getProject({
  organizationId,
  projectId,
});
```

and:

```ts
requireProjectAccess({
  organizationId,
  projectId,
});
```

Before building the create-project form, verify that a project from another organization cannot be loaded even when its exact ID is known.

This establishes the security boundary that every later SignalFlow feature will depend on.

---

# Next Feature

After Project Management is complete:

```text
CSV Feedback Import
```

That feature should use the trusted organization and project contexts defined here.

A feedback import must never be created from an unverified client-supplied:

```text
organizationId
projectId
```
