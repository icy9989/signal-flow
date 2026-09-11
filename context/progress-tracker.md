# Progress Tracker

Update this file whenever the current phase, active feature,  or implementation state changes.

## Current Phase

- Phase 2 — Multi-Tenant Foundation.
- Application shell, Clerk authentication, PostgreSQL/Prisma, user synchronization, and organization workspaces implemented. Tenant isolation is verified; interactive signed-in browser verification remains outstanding.

## Current Goal

- Implement Project Management from `feature-specs/02-project-management.md`, then verify authorization, creation, selection, and UI.

## Completed

### Application shell and dark design system — 2026-09-11

- **Feature:** Phase 1 presentation shell.
- **Status:** Implemented; lint, TypeScript, production build, and local route smoke check passed. Browser interaction and visual QA remain unverified.
- **Completed:**
  - Read all six context documents and the installed Next.js layouts/pages guide.
  - Moved the starter application to `src/app/`, matching the code standards, and updated the `@/*` alias.
  - Added all specified core, green accent, semantic, chart, sentiment, and severity color tokens; enforced dark-only rendering.
  - Added locally bundled Geist Sans / Geist Mono fonts, product metadata, and shared button and Radix-backed Sheet presentation primitives following shadcn composition conventions.
  - Added a 248px desktop sidebar, compact topbar, active Overview navigation, and mobile drawer with accessible title, description, and close control.
  - Added skip navigation, visible keyboard focus, reduced-motion handling, and responsive layouts.
  - Added `/app/overview` with a truthful empty workspace and the documented workspace → project → CSV sequence. `/` redirects to it.
  - Kept unavailable navigation and actions disabled; no fabricated users, organizations, metrics, or AI outputs.
- **Files changed:**
  - `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/app/layout.tsx`, `src/app/app/overview/page.tsx`.
  - `src/app/favicon.ico` moved from the starter unchanged.
  - `src/components/layout/{application-shell,mobile-navigation,navigation}.tsx`.
  - `src/components/ui/{button,sheet}.tsx`, `src/lib/utils.ts`.
  - `package.json`, `package-lock.json`, `tsconfig.json`.
  - `context/architecture-context.md`, `context/progress-tracker.md`.
- **Verification:**
  - `npm run lint` passed.
  - `npx tsc --noEmit` passed.
  - `npm run build` passed, including prerendering `/app/overview`.
  - Local development request to `/app/overview` returned HTTP 200.
  - Build required execution outside the sandbox and clearing generated caches containing a previous sandbox port-binding failure.
- **Known issues:**
  - This is a public, static presentation preview. Authentication, route protection, database access, and real workspace setup are not implemented.
  - No browser-based visual, drawer keyboard, or responsive interaction tests were performed; do not treat those as verified.
  - Next.js reports a non-blocking warning about a parent-directory lockfile outside the repository.
  - No Sites deployment: its Workers output would require a departure from the specified Next.js / Vercel-compatible architecture.
- **Next unit:** Select and document authentication provider/session strategy, then implement and verify authentication and protected application access.

## In Progress

- Project Management (`feature-specs/02-project-management.md`) — in progress: authorization foundation, organization-scoped listing, creation, active selection, and modern dark/green UI. MEMBER creation permission is awaiting clarification; no permanent input limits will be invented.

- Organization Workspaces (`feature-specs/01-organization-workspaces.md`) — implemented; authenticated browser acceptance and visual/keyboard/mobile verification outstanding because no browser is connected. Server verification passed; details below.

## Next Up

1. Connect a browser and verify sign-in → onboarding → create workspace → active overview, plus switching and mobile/keyboard behavior.
2. Implement project creation using the verified organization context after workspace acceptance.

## Open Questions

- Clerk is the selected authentication provider; default Clerk sign-in methods remain pending dashboard configuration.
- The existing Prisma Postgres connection in `.env.local` is configured and verified; its initial migration has been applied.
- Later phases still require explicit CSV limits / duplicate policy, AI provider and schema details, and bounded queue retry policy before those behaviors are implemented.

## Architecture Decisions

- Preserve the specified Next.js App Router, TypeScript, Tailwind, PostgreSQL, and Prisma direction.
- Presentation lives under `src/`; Server Components remain the default. The mobile Sheet is a narrow interactive client boundary.
- `/app/*` is authenticated. Workspace layouts, pages, and actions independently resolve identity and verify memberships; PostgreSQL memberships are the tenant authority.
- Workspace names are trimmed and limited to 100 characters (user-approved). `/app/...` routes use a revalidated server-managed active-workspace cookie.
- Clerk owns authentication sessions; `/app/*` is protected in its server layout, while `/sign-in` and `/sign-up` remain public.

### Clerk authentication — 2026-09-11

- **Feature:** Clerk authentication foundation.
- **Status:** Implemented; Clerk CLI diagnostics, lint, TypeScript, production build, and unauthenticated route smoke check passed.
- **Completed:**
  - Linked the project to the specified Clerk application and installed `@clerk/nextjs`.
  - Added `ClerkProvider` inside the document body.
  - Added Clerk sign-in and sign-up routes.
  - Added current Clerk middleware with the required API/TRPC and `/__clerk/:path*` matchers.
  - Protected the `/app` route tree with awaited `auth.protect()` in its layout.
  - Added signed-out sign-in/sign-up controls and signed-in `UserButton` to the application header.
  - Pulled development environment values into `.env.local` through the CLI.
- **Verification:**
  - `clerk doctor` passed; development instance is configured and reachable.
  - `npm run lint` passed.
  - `npx tsc --noEmit` passed.
  - `npm run build` passed.
  - `GET /app/overview` returned `307` to Clerk sign-in when unauthenticated.
- **Known issues:**
  - Clerk doctor reports no production instance configured; configure one before deployment.
  - Clerk CLI reports optional zsh shell completion is not installed.

  ### Branded authentication flows — 2026-09-11

  - **Feature:** SignalFlow-owned sign-in and sign-up UI with Clerk authentication.
  - **Status:** Implemented; custom-flow lint, TypeScript, and production build passed.
  - **Completed:**
    - Added a branded custom auth screen using Clerk's `useSignIn` and `useSignUp` hooks.
    - Mounted Clerk's `clerk-captcha` element for bot-protected custom sign-up flows.
    - Added branded Google and GitHub OAuth actions.
    - Added `/sso-callback` to finalize OAuth sign-in or sign-up sessions before routing to the app.
    - Verified the linked development instance has Google and GitHub OAuth enabled.
  - **Known issues:**
    - OAuth providers must also be configured with production credentials before production deployment.

## Session Notes

- Follow the one-feature-unit workflow in `ai-workflow-rules.md`; do not mark the entire SaaS or Phase 1 complete based on the shell.
- Existing user changes were retained. `next dev` refreshed its generated Next.js rules block in `AGENTS.md`; the application context instructions remain intact.
- Fonts are bundled through `geist`, avoiding remote font fetches during production builds.

### Prisma ORM setup — 2026-09-11

- **Feature:** Prisma 7 ORM configuration foundation.
- **Status:** Implemented; CLI/client versions aligned and schema/client generation verified.
- **Completed:**
  - Removed the duplicate default export from `prisma.config.ts`.
  - Aligned `prisma` and `@prisma/client` to `7.10.0`.
  - Kept the datasource URL in `prisma.config.ts`, as required by Prisma 7.
  - Allowed client generation without inventing a database credential when `DATABASE_URL` is not yet configured.
  - Generated the client at `src/generated/prisma`.
- **Verification:**
  - `npx prisma --version` reports both ORM packages at `7.10.0`.
  - `npx prisma validate` passes.
  - `npx prisma generate` passes.
  - `npx tsc --noEmit` passes.
- **Open requirement:**
  - Set a real `DATABASE_URL` in the local environment before running migrations, Prisma Studio, or database queries.

### Core domain models — 2026-09-11

- **Feature:** Initial tenant-safe Prisma model file.
- **Status:** Implemented; schema formatting, validation, client generation, and TypeScript checks passed.
- **Completed:**
  - Added users linked to Clerk through `externalAuthId`.
  - Added organizations, memberships, roles, and tenant-owned projects.
  - Added CSV import history and import processing counters.
  - Added raw feedback with processing status and source metadata.
  - Kept AI analysis separate from original feedback for reprocessing and auditability.
  - Added topics, explicit topic-feedback evidence links, insights, and pgvector embedding storage.
- **Next unit:** Configure `DATABASE_URL`, create the first migration, and add tenant-aware Prisma access helpers.

### Database connection and initial migration — 2026-09-11

- **Feature:** Feature 1 — usable PostgreSQL/Prisma foundation.
- **Status:** Implemented and verified against the configured database.
- **Completed:**
  - Fixed Prisma environment loading to include `.env.local` using `@next/env`; added optional migration-only `DIRECT_URL` support.
  - Added a server-only, lazy shared Prisma 7 client using `@prisma/adapter-pg`, a bounded connection pool, timeouts, and URL schema support.
  - Confirmed the target database was empty and pgvector was available before applying the reviewed, transactional initial migration.
  - Applied all 11 existing model tables, indexes, relationships, enums, and the pgvector extension.
  - Added generation, migration, status, Studio, and connection-check scripts; builds generate Prisma Client automatically.
  - Added a credential-free `.env.example`, ignored generated Prisma output, and documented setup in `prisma/README.md`.
- **Files changed:** `prisma.config.ts`, `prisma/migrations/*`, `prisma/README.md`, `src/server/db/client.ts`, `scripts/check-database.ts`, `.env.example`, `.gitignore`, `package.json`, `package-lock.json`, and architecture/progress context.
- **Verification:** Migration deploy/status passed; live schema diff reports no difference; runtime client queried all 11 tables and verified pgvector; TypeScript and production build passed.
- **Known issues:** Local connection uses the provider's configured pooled endpoint, which successfully applied this migration. Future `migrate dev` requires shadow-database support; use a suitable development/direct connection if needed.
- **Next unit:** Authenticated Clerk-to-User synchronization (completed below).

### Clerk application-user synchronization — 2026-09-11

- **Feature:** Feature 2 — connect authenticated Clerk identities to local `User` records.
- **Status:** Implemented; live database integration verified. Interactive browser sign-in was unavailable.
- **Completed:**
  - Added `requireApplicationUser()` with Clerk server authentication and request-local deduplication.
  - Protected application entry now synchronizes the Clerk profile to Prisma by `externalAuthId`, preserving the local user ID and refreshing primary email, name, and image.
  - Validated profiles, matching identity, and verified primary email; different identities are never linked by email.
  - Added a parent error boundary with retry and sanitized synchronization failure handling.
  - Added rollback-only integration tests and documented access-time synchronization and its lifecycle boundaries.
- **Files changed:** `src/server/auth/require-application-user.ts`, `src/server/services/sync-clerk-user.ts`, `src/app/app/layout.tsx`, `src/app/error.tsx`, `tests/database.test.ts`, and database/context documentation.
- **Verification:**
  - All three integration tests passed: create/repeat/profile update, invalid or mismatched identity rejection, and email-collision isolation. All test writes rolled back.
  - A real profile read through the linked Clerk development CLI synchronized successfully twice in a rollback-only transaction.
  - Clerk diagnostics passed; anonymous `/app/overview` returned HTTP 307.
  - Lint passed with one existing warning in an installed Clerk skill template; TypeScript and `npm run build` passed.
  - Production build required running outside the sandbox; no source workaround was introduced.
- **Known issues:** No browser was available for an interactive authenticated navigation test. Clerk production instance/OAuth credentials remain unconfigured. Synchronization occurs on server application entry, not continuously through webhooks; account deletion/retention is deferred as documented.
- **Next unit:** Organization creation with owner membership and tenant authorization.

### Explicit PostgreSQL SSL verification — 2026-09-11

- **Feature:** Remove PostgreSQL driver SSL alias warning.
- **Status:** Implemented and verified.
- **Completed:** Changed `sslmode=require` to `sslmode=verify-full` in the local database URL and credential-free example, preserving certificate and hostname verification explicitly.
- **Files changed:** `.env.local` (ignored), `.env.example`, `context/progress-tracker.md`.
- **Verification:** `npm run db:check` passed against all 11 tables with pgvector installed and no SSL warning.
- **Known issues:** Restart the running development server to replace its cached Prisma connection pool and clear the previously emitted warning.
- **Next unit:** Organization workspace onboarding.

### Organization Workspaces — 2026-09-11

- **Feature:** `feature-specs/01-organization-workspaces.md`, implementation units 1–5.
- **Status:** Implemented with server/database verification complete; browser acceptance remains outstanding. The full definition of done is not yet claimed.
- **Completed:**
  - Central server-only membership and role checks; trusted identity is resolved independently by every service operation. Unavailable workspace responses conceal tenant existence.
  - Membership-scoped organization listing and deterministic zero/one/multiple workspace resolution. Forged, stale, and revoked preferences cannot grant access.
  - Server-validated creation with the user-approved 100-character name limit, normalized unique slugs, bounded conflict retries, and an atomic organization + OWNER nested write.
  - Server-managed HttpOnly/SameSite cookie; selection is membership-checked, then the application layout is revalidated and navigation returns to `/app/overview`.
  - Modern dark onboarding, compact creation form, accessible Radix workspace chooser on desktop/mobile, pending and validation states, loading skeleton, and truthful empty project state. No fabricated projects or analytics.
  - `/app` redirect and correct navigation highlighting on the create-workspace route. Existing Clerk identity/session behavior retained.
- **Files changed:** `src/server/{auth/organization-context,services/organization-service,repositories/organization-repository}.ts`, `src/lib/validation/organization.ts`, `src/app/app/{layout,page,loading,workspace-actions}.tsx/ts`, `src/app/app/overview/page.tsx`, `src/app/app/workspaces/new/page.tsx`, organization/layout components, `src/components/ui/dialog.tsx`, `tests/{organizations,workspace-actions}.test.ts`, `package.json`, and feature/architecture/progress context.
- **Verification:**
  - `npm run test:db`: 13 passing live PostgreSQL tests (three existing identity tests and ten workspace tests). Temporary workspace fixtures were cleaned up; existing identity tests remain rollback-only.
  - Covered owner identity and uniqueness, atomic rollback on owner failure, invalid names and exact length boundary, eight competing same-name creations, non-ASCII slug fallback, zero/one/multiple memberships, stale/revoked selection, role checks, and A→B/B→A access denial.
  - `npm run test:actions`: three passing tests of actual action/service orchestration with mocked request/session/database dependencies. Verified authentication redirects, validation, HttpOnly cookie options, active selection persistence, layout refresh, and forbidden switches without cookie writes.
  - `npx tsc --noEmit` passed. `npm run lint` passed with the existing warning in the installed Clerk TanStack skill template.
  - `npm run build` passed after clearing generated build caches that retained a sandbox port-binding failure and running with the required process permissions.
  - Anonymous requests to `/app/overview` and `/app/workspaces/new` returned HTTP 307 to authentication.
- **Known issues:**
  - Browser discovery returned no connected browsers. Authenticated end-to-end interaction, visual review, mobile layout, and dialog keyboard behavior are not claimed as tested.
  - Action tests ran on Node 24.19 with experimental module mocking; Node emits experimental/deprecation notices for the compatible mock API.
  - Existing Clerk production configuration and parent-directory lockfile warning remain as previously documented.
- **Next unit:** Browser acceptance, then Project Creation. Invitations, role editing, rename/deletion, ownership transfer, billing, imports, and AI remain deferred.

### Project Management — 2026-09-11

- **Status:** In progress.
- **Completed:** Organization-scoped project repository, independent membership authorization, non-leaking project lookup, listing and safe active selection foundation.
- **Verification:** Two live PostgreSQL tests pass, including known-ID cross-tenant denial in both directions and scoped listing/selection. Test fixtures removed.
- **Next unit:** Creation, server-managed preference, and modern project UI. Role policy follows the product overview: OWNER/ADMIN create; MEMBER views/selects. Input length limits remain unset per spec.
