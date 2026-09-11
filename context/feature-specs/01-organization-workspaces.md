# Organization Workspaces

## Feature

Create and manage the organization workspace boundary for SignalFlow.

This feature establishes the multi-tenant foundation required before projects, feedback imports, analytics, or AI-owned data are implemented.

The feature includes:

1. Create an organization workspace.
2. Create the authenticated user as the workspace `OWNER`.
3. Resolve the organizations available to the authenticated user.
4. Select and resolve the active organization.
5. Enforce organization membership on every protected organization operation.
6. Ensure tenant-owned data can never be read or mutated across organization boundaries.

---

# Goal

After authentication, a SignalFlow user must operate inside a trusted organization context.

The required flow is:

```text
Authenticated User
      ↓
Resolve Local Application User
      ↓
Resolve Organization Memberships
      ↓
Select / Resolve Active Organization
      ↓
Verify Membership
      ↓
Trusted Organization Context
      ↓
Organization-Scoped Application Features
```

At the end of this feature, the application must be ready to safely implement project creation.

---

# Scope

## In Scope

- Organization creation
- Organization slug generation and uniqueness handling
- Owner membership creation
- Organization membership lookup
- Active organization resolution
- Workspace selector UI when a user belongs to multiple organizations
- Empty/onboarding state when a user belongs to no organizations
- Organization-scoped authorization helpers
- Organization-scoped service/repository contracts
- Tenant-isolation checks
- Loading, empty, validation, forbidden, and error states
- Tests for the multi-tenant boundary

## Out of Scope

Do not implement these as part of this feature:

- Project creation
- Team invitations
- Member management UI
- Role editing
- Billing
- Usage limits
- CSV import
- Feedback processing
- AI processing
- Analytics
- Organization deletion
- Organization ownership transfer
- Advanced RBAC

Those features depend on the organization boundary but should be implemented separately.

---

# Existing Foundation

This feature assumes the following already work:

- Clerk authentication
- Protected application access
- `requireApplicationUser()`
- Local application user synchronization
- PostgreSQL
- Prisma
- `User`
- `Organization`
- `OrganizationMember`
- `OrganizationRole`

The authentication layer establishes identity.

This feature establishes authorization and tenant context.

Authentication and authorization must remain separate concerns.

---

# Core Data Model

The existing organization models are the source of truth.

## Organization

```text
id
name
slug
createdAt
updatedAt
```

`Organization` is the primary tenant boundary.

## OrganizationMember

```text
id
organizationId
userId
role
createdAt
```

Supported roles:

```text
OWNER
ADMIN
MEMBER
```

Membership must enforce:

```text
organizationId + userId
```

as a unique pair.

A user may belong to multiple organizations.

An organization may contain multiple users.

---

# Product Behavior

## 1. User Has No Workspace

When an authenticated user has no organization memberships, `/app` should not display organization-owned product data.

Show a workspace onboarding state.

Example:

```text
Create your workspace

Set up an organization workspace before creating
projects and importing customer feedback.

[ Create Workspace ]
```

The primary action opens the organization creation form.

The application must not create fake/default organization records silently.

---

# 2. Create Workspace

The minimum form contains:

```text
Workspace name
```

Example:

```text
Acme Inc.
```

The workspace name is required.

The server derives the organization slug from the validated name.

Example:

```text
Acme Inc.
↓
acme-inc
```

The browser must not be trusted to assign:

- organization ID
- owner user ID
- role
- membership
- permissions

These values are resolved server-side.

---

# 3. Workspace Creation Transaction

Organization creation and owner membership creation form one atomic operation.

The operation must follow:

```text
Authenticate
    ↓
Resolve application user
    ↓
Validate workspace input
    ↓
Generate available slug
    ↓
BEGIN TRANSACTION
    ↓
Create Organization
    ↓
Create OrganizationMember
role = OWNER
    ↓
COMMIT
```

If owner membership creation fails, organization creation must also fail.

Do not leave an organization without its initial owner.

Conceptually:

```ts
await prisma.$transaction(async (tx) => {
  const organization = await tx.organization.create({
    data: {
      name,
      slug,
    },
  });

  await tx.organizationMember.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      role: "OWNER",
    },
  });

  return organization;
});
```

The exact implementation should use the project's service/repository boundaries rather than placing database logic directly inside a UI component.

---

# 4. Slug Rules

A workspace slug should be:

- generated server-side
- URL-safe
- normalized
- unique
- stable unless an explicit rename/slug-edit feature is introduced later

Recommended normalization:

```text
" Acme Product Team "
        ↓
"acme-product-team"
```

If the normalized slug already exists, generate a unique alternative.

Example:

```text
acme
acme-2
acme-3
```

Do not expose database uniqueness errors directly to the user.

Slug generation is infrastructure behavior, not an authorization mechanism.

Authorization must continue to use organization membership and trusted organization IDs.

---

# 5. Owner Membership

The creator of an organization becomes:

```text
OWNER
```

The owner membership must be created by server-side application logic.

Never accept this from the browser:

```json
{
  "role": "OWNER"
}
```

as trusted authorization input.

For the initial workspace feature:

- `OWNER` has full organization access.
- `ADMIN` and `MEMBER` remain valid database roles.
- Invitation, role-editing, and member-management behavior is deferred.

---

# Active Organization

## Purpose

A user may eventually belong to multiple organizations.

SignalFlow therefore needs one active organization context for workspace-owned pages and actions.

The active organization is a navigation/application context.

It is not proof of authorization.

Every protected server operation must still verify that the current user is a member of that organization.

---

# Active Organization Resolution

Use the following behavior:

## Zero Memberships

```text
memberships.length === 0
```

Result:

```text
Show workspace onboarding
```

No organization-owned data should be queried.

## One Membership

```text
memberships.length === 1
```

Result:

```text
Use that organization as the active organization.
```

The user does not need to select it manually.

## Multiple Memberships

```text
memberships.length > 1
```

Result:

```text
Resolve the previously selected organization when valid.
Otherwise require/default to a valid membership and expose
a workspace selector.
```

Any stored active organization value is only a preference.

It must be checked against the current user's memberships before use.

---

# Recommended V1 Active-Workspace Persistence

The existing project context requires active organization selection but does not define how the selection is persisted.

For V1, a simple recommended approach is:

```text
Server-managed active organization preference
```

For example, a secure application cookie containing an organization identifier can remember the selected workspace.

Important:

```text
Cookie value
    ↓
Treat as untrusted preference
    ↓
Resolve authenticated user
    ↓
Verify OrganizationMember exists
    ↓
Only then create trusted organization context
```

Never treat a cookie, route parameter, form value, local storage value, or client state as proof that the user belongs to an organization.

If the stored organization is no longer accessible, ignore it and resolve another valid membership or show onboarding.

---

# Workspace Selector UI

Place the selector in the application shell/sidebar where the active workspace is always visible.

Example:

```text
┌──────────────────────────┐
│  SF  SignalFlow          │
│                          │
│  Acme Inc.            ▾  │
│                          │
│  Overview                │
│  Feedback                │
│  Topics                  │
└──────────────────────────┘
```

When clicked:

```text
Acme Inc.              ✓
Demo Workspace

────────────────────────
Create workspace
```

Only organizations that the authenticated user belongs to may appear.

Do not query all organizations and filter them in the browser.

---

# Create Workspace UI

Use the existing SignalFlow design language:

- dark neutral surface
- subtle border
- primary green CTA
- compact form
- clear heading
- muted explanatory text
- visible green focus state
- accessible validation errors
- responsive modal/page behavior

Suggested form:

```text
Create workspace

Workspaces keep projects, feedback, analytics,
and team data isolated from other organizations.

Workspace name
[ Acme Inc.                         ]

                    [Cancel] [Create workspace]
```

After successful creation:

```text
Create Organization
      ↓
Create OWNER membership
      ↓
Set/resolve new organization as active
      ↓
Navigate to organization workspace / overview
```

The resulting workspace should initially show a truthful empty state because project creation is a separate feature.

Example:

```text
No projects yet

Create your first project to start importing
and analyzing customer feedback.

[ Create Project ]
```

The button may remain disabled or route to the next implementation unit depending on the project's current progress. Do not fabricate project records.

---

# Authorization Model

Every organization-owned operation must follow:

```text
1. Authenticate user
2. Resolve local application user
3. Resolve organization
4. Verify OrganizationMember
5. Verify role/permission when required
6. Scope resource query to organization
7. Perform operation
```

Authentication alone is never sufficient.

A protected layout is also not an authorization boundary.

Every Server Action, Route Handler, service entry point, or other server-side mutation/query must protect itself.

---

# Authorization Helpers

Keep authorization logic centralized and server-only.

Recommended conceptual helpers:

```ts
requireApplicationUser()

requireOrganizationMembership({
  organizationId,
})

requireOrganizationRole({
  organizationId,
  roles,
})
```

A useful trusted context shape is:

```ts
type OrganizationContext = {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  membership: {
    id: string;
    role: OrganizationRole;
  };
  user: {
    id: string;
  };
};
```

Only server-side authorization code should construct this trusted context.

Do not accept a full `OrganizationContext` from the client.

---

# Membership Lookup

Membership should be resolved using both:

```text
organizationId
userId
```

Conceptually:

```ts
const membership = await prisma.organizationMember.findUnique({
  where: {
    organizationId_userId: {
      organizationId,
      userId,
    },
  },
});
```

If no membership exists, fail closed.

Do not continue with a partially resolved organization context.

---

# Tenant Isolation

Organization is the primary tenant boundary.

Every tenant-owned resource must either:

1. contain `organizationId` directly, or
2. belong through an ownership chain that is explicitly checked.

When direct organization scope exists, include it in tenant-owned queries.

Avoid:

```ts
await prisma.project.findUnique({
  where: {
    id: projectId,
  },
});
```

Prefer logically:

```ts
await prisma.project.findFirst({
  where: {
    id: projectId,
    organizationId,
  },
});
```

The same rule will later apply to:

- projects
- imports
- feedback
- feedback analysis
- embeddings
- topics
- insights
- usage
- subscriptions
- jobs containing tenant-owned references

---

# Repository Contracts

Make tenant scope visible in function signatures.

Prefer:

```ts
getProject({
  organizationId,
  projectId,
});
```

over:

```ts
getProject(projectId);
```

Prefer:

```ts
listProjects({
  organizationId,
});
```

over:

```ts
listProjects();
```

This reduces the chance of accidentally introducing cross-tenant queries later.

---

# Organization Queries

## List Current User Organizations

The query must begin from the authenticated user's memberships.

Conceptually:

```ts
organizationMember.findMany({
  where: {
    userId,
  },
  select: {
    role: true,
    organization: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
  },
});
```

Do not:

```ts
organization.findMany()
```

and filter client-side.

---

# Client Input Rules

Treat all browser-supplied values as untrusted.

Examples:

```text
organizationId
organizationSlug
activeOrganizationId
userId
role
```

A client may request:

```text
"Switch to organization X"
```

but the server must interpret it as:

```text
"Check whether the authenticated user is a member of X.
If yes, update the active organization preference.
If no, reject without exposing private tenant information."
```

---

# Error Behavior

Use predictable application errors.

## Unauthenticated

```text
401
```

or redirect to the existing authentication flow where appropriate.

## Invalid Workspace Input

```text
400
VALIDATION_ERROR
```

Example user message:

```text
Enter a workspace name.
```

## Organization Not Accessible

Prefer behavior that does not reveal cross-tenant resource existence.

For resource access, a `404`-style unavailable response may be preferable to leaking:

```text
"Organization exists, but you do not belong to it."
```

For explicit workspace-switch requests, use the project's consistent authorization error strategy.

## Slug Conflict

Resolve automatically where possible.

If creation cannot resolve the conflict:

```text
409
CONFLICT
```

Do not return raw database errors.

## Unexpected Failure

```text
500
```

Log server context without exposing stack traces or secrets to the browser.

---

# Validation

Validate organization creation at the server boundary.

Conceptual schema:

```ts
const CreateOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required")
    .max(/* project-defined limit */),
});
```

If the project has not yet defined a maximum workspace-name length, do not silently invent one as a product rule. Add the limit as an explicit product decision before enforcing it.

Do not accept:

```text
ownerId
role
createdBy
organizationId
```

from the client as trusted creation fields.

---

# Suggested Server Structure

Follow the existing architecture boundaries.

```text
src/
├── app/
│   └── app/
│       └── ...
│
├── server/
│   ├── auth/
│   │   ├── require-application-user.ts
│   │   └── organization-context.ts
│   │
│   ├── services/
│   │   └── organization-service.ts
│   │
│   └── repositories/
│       └── organization-repository.ts
│
├── components/
│   └── organization/
│       ├── create-workspace-form.tsx
│       └── workspace-switcher.tsx
│
└── lib/
    └── validation/
        └── organization.ts
```

Exact filenames may follow the existing repository structure.

Do not create abstractions that the current codebase does not need.

---

# Service Responsibilities

The organization service should own business operations such as:

```text
createOrganizationForUser()
listOrganizationsForUser()
resolveActiveOrganization()
switchActiveOrganization()
```

The service must receive trusted user identity from the authentication layer.

The repository should own narrowly scoped database access.

UI components should not directly implement authorization rules.

---

# Server Component Usage

Prefer React Server Components for:

- loading organization memberships
- resolving the active organization
- rendering organization-owned page data
- initial workspace shell data

Use small Client Components only where browser interaction is needed, such as:

- opening the workspace selector
- submitting interactive forms
- dropdown state

Do not mark the whole application shell `"use client"` just to support workspace switching.

---

# Workspace Request Flow

A normal organization-owned page should resolve like this:

```text
Browser
   ↓
Protected route
   ↓
requireApplicationUser()
   ↓
resolveActiveOrganization()
   ↓
verify membership
   ↓
trusted organization context
   ↓
service
   ↓
organization-scoped repository query
   ↓
PostgreSQL
```

---

# Workspace Creation Flow

```text
User opens application
      ↓
No memberships found
      ↓
Workspace onboarding
      ↓
User enters workspace name
      ↓
Server Action / Route Handler
      ↓
Authenticate
      ↓
Validate
      ↓
Transaction:
  Organization
  + OWNER Membership
      ↓
Resolve new workspace as active
      ↓
Redirect to /app/overview
      ↓
Show truthful empty project state
```

---

# Workspace Switching Flow

```text
User selects another workspace
      ↓
Send requested organization identifier
      ↓
Server authenticates user
      ↓
Server verifies membership
      ↓
Update active-workspace preference
      ↓
Refresh / redirect organization-owned UI
      ↓
All data reloaded under new trusted org context
```

Client-side visual state alone must never switch data authority.

---

# Security Invariants

These are non-negotiable.

## Invariant 1

A user cannot access an organization without an `OrganizationMember` record for that user and organization.

## Invariant 2

The browser cannot grant itself `OWNER`, `ADMIN`, or `MEMBER` access.

## Invariant 3

The active workspace preference is never treated as authorization.

## Invariant 4

Tenant-owned resources are not retrieved by globally unique resource ID alone when organization scope can also be applied.

## Invariant 5

Organization creation and initial owner membership are atomic.

## Invariant 6

Organization-owned operations fail closed when membership cannot be verified.

## Invariant 7

Cross-tenant access errors must not reveal private tenant data.

## Invariant 8

Future background jobs must carry and revalidate tenant ownership when loading resources.

---

# Verification

This feature is not complete until tenant isolation is explicitly tested.

## Workspace Creation

Verify:

- authenticated user can create a workspace
- organization is persisted
- exactly one owner membership is created for the creator
- owner membership references the correct local user
- workspace creation fails atomically if membership creation fails
- duplicate/competing slug creation is handled safely
- invalid names are rejected

## Active Workspace

Verify:

- zero memberships show onboarding
- one membership resolves automatically
- multiple memberships expose valid choices
- selected workspace persists using the chosen V1 mechanism
- inaccessible/stale active workspace values are rejected/ignored
- switching workspaces reloads organization-owned state

## Authorization

Verify:

- unauthenticated requests fail
- authenticated non-members cannot access an organization
- a member can access their own organization
- browser-supplied `userId` cannot impersonate another user
- browser-supplied role cannot elevate permissions
- browser-supplied organization ID is always membership-checked

## Isolation Test

Create:

```text
User A
Organization A

User B
Organization B
```

Then verify:

```text
User A → Organization A     allowed
User B → Organization B     allowed

User A → Organization B     denied
User B → Organization A     denied
```

When project creation is added, repeat this test with project IDs from the opposite tenant.

---

# Suggested Tests

Prioritize server-side tests around the authorization boundary.

Examples:

```text
createOrganizationForUser creates OWNER membership
createOrganizationForUser is atomic
requireOrganizationMembership accepts valid member
requireOrganizationMembership rejects non-member
resolveActiveOrganization accepts a valid membership
resolveActiveOrganization rejects stale active org
listOrganizationsForUser returns only memberships
tenant-owned repository query includes organization scope
```

A browser/UI test should also cover:

```text
sign in
→ no workspace
→ create workspace
→ land in active workspace
→ workspace name appears in shell
```

---

# Definition of Done

The Organization Workspaces feature is complete when:

- [ ] Authenticated user with no organization sees workspace onboarding.
- [ ] User can create a workspace.
- [ ] Workspace input is validated server-side.
- [ ] Organization is stored in PostgreSQL.
- [ ] Creator receives exactly one `OWNER` membership.
- [ ] Organization + owner membership creation is atomic.
- [ ] User organizations are loaded from memberships rather than global organization queries.
- [ ] One organization can be resolved as the active workspace.
- [ ] Multiple organizations can be selected through a workspace selector.
- [ ] Any persisted active organization value is revalidated against membership.
- [ ] Every organization-owned server operation authenticates independently.
- [ ] Authorization helpers resolve membership server-side.
- [ ] Tenant-owned repository contracts include organization context.
- [ ] Cross-tenant organization access is denied.
- [ ] Unauthorized access does not leak private organization information.
- [ ] Empty, loading, validation, and error states follow the SignalFlow UI system.
- [ ] Lint passes.
- [ ] TypeScript passes.
- [ ] Relevant tests pass.
- [ ] Production build passes.
- [ ] `progress-tracker.md` is updated.

---

# Implementation Order

Keep this feature incremental.

## Unit 1 — Organization Authorization Foundation

Implement and verify:

```text
list memberships for current user
requireOrganizationMembership()
trusted organization context
```

Do not build project creation yet.

## Unit 2 — Create Workspace

Implement:

```text
workspace form
validation
organization + OWNER transaction
success/error behavior
```

Verify end to end.

## Unit 3 — Active Workspace Resolution

Implement:

```text
0 memberships → onboarding
1 membership → automatic selection
multiple memberships → active selection
stale/invalid selection → safe fallback
```

Verify all paths.

## Unit 4 — Workspace Selector

Implement the UI and secure server-side switch operation.

Verify the selector exposes only organizations belonging to the current user.

## Unit 5 — Tenant Isolation Verification

Run explicit cross-tenant tests before moving forward.

Only after these units pass should the next feature begin:

```text
Project Creation
```

---

# Open Product Decisions

## Resolved for V1 — 2026-09-11

- Workspace names: required, trimmed, maximum 100 characters (approved by the user).
- Server-generated stable slugs; no manual editing in this feature.
- Active workspace: server-managed HttpOnly cookie, revalidated against membership on each server entry.
- URLs remain `/app/...`; workspace selection redirects to `/app/overview`.
- Rename, deletion, and ownership transfer remain deferred.

The existing SignalFlow context defines active organization selection but does not specify every persistence/detail rule.

Resolve these before treating them as permanent product behavior:

1. Maximum organization/workspace name length.
2. Whether users may manually edit workspace slugs.
3. Exact active-workspace persistence mechanism.
4. Exact URL strategy for organizations:
   - `/app/...` with server-managed active organization, or
   - `/app/[organizationSlug]/...`.
5. Organization rename behavior.
6. Organization deletion behavior.
7. Ownership-transfer behavior.

These decisions are not required to begin the authorization foundation, but they should not be invented implicitly inside unrelated implementation work.

---

# Next Feature

After organization workspaces and tenant isolation are fully verified:

```text
Project Creation
```

The project feature must use the trusted organization context established here.

A project must never be created from an unverified client-supplied `organizationId`.
