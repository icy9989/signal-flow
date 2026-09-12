# Progress Tracker

Update this file whenever the current phase, active feature,  or implementation state changes.

## Current Phase

- Phase 5 — AI Feedback Classification.
- Application shell, Clerk authentication, PostgreSQL/Prisma, user synchronization, and organization workspaces implemented. Tenant isolation is verified; interactive signed-in browser verification remains outstanding.

## Current Goal

- AI Feedback Classification (`feature-specs/07-ai-feedback-classification.md`) — in progress. Implement units 1–8 sequentially: contract, prompt/provider, normalization, persistence, reuse/retry, failures, read-only Inbox integration, and verification.

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

- AI Feedback Classification — specification reviewed; starting the validated classification contract. Provider/model selection requested; independent schema and persistence work can proceed.

- Feedback Inbox — implemented; authenticated end-to-end interaction, visual/mobile and keyboard acceptance remain outstanding because browser discovery returned no connected browsers.

- Onboarding Flow (`feature-specs/03-onboarding-flow.md`) — shared CSV preview/execution and persisted result are integrated. Successful imports activate the project; completed onboarding lands at `/app/feedback`. Full browser activation acceptance remains outstanding.

- Project Management (`feature-specs/02-project-management.md`) — implemented; database, action, TypeScript, lint, and production-build checks pass. Authenticated browser acceptance remains in progress because no browser is connected.

- Organization Workspaces (`feature-specs/01-organization-workspaces.md`) — implemented; authenticated browser acceptance and visual/keyboard/mobile verification outstanding because no browser is connected. Server verification passed; details below.

## Next Up

1. Connect a browser and verify sign-in → onboarding → workspace → project → CSV preview → confirmation → result → feedback/history, including refresh, switching, and mobile/keyboard behavior.
2. Complete authenticated Feedback Inbox browser acceptance: search, filters, clear, pagination, detail/back, mobile layout and keyboard interaction.
3. Keep AI classification and background processing separate from import completion.

## Open Questions

- Clerk is the selected authentication provider; default Clerk sign-in methods remain pending dashboard configuration.
- The existing Prisma Postgres connection in `.env.local` is configured and verified; its initial migration has been applied.
- CSV engineering limits and external-ID duplicate policy are documented in the architecture; permanent plan limits, AI provider/schema details and bounded queue retry policy remain future decisions.

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

- **Feature:** `feature-specs/02-project-management.md`, units 1–6.
- **Status:** Implemented; server/database checks complete. Authenticated browser acceptance remains outstanding; the full definition of done is not yet claimed.
- **Completed:**
  - Organization-scoped repository and independently authenticated membership authorization; known cross-tenant IDs receive non-leaking errors.
  - Server-validated creation with trimmed names/descriptions, OWNER/ADMIN enforcement, trusted organization ownership, and friendly database uniqueness conflicts.
  - Scoped project list, explicit empty state, creation form, and desktop/mobile project selectors. Workspace and project selection remain distinct.
  - Revalidated HttpOnly project preference; zero/one/multiple projects and stale/deleted/cross-workspace preferences resolve safely.
  - Selected-project overview, creation confirmation, project navigation highlighting, pending states, loading skeletons, and retry errors. CSV import stays disabled and no analytics are fabricated.
  - Standard test scripts now include project database and action suites.
- **Files changed:** Application layout/overview/project actions/loading/error routes; layout navigation components; `tests/projects.test.ts`, `tests/project-actions.test.ts`; `package.json`; architecture/progress documentation. Existing project service, repository, validation, forms, and selector foundation integrated and verified.
- **Verification:**
  - `npm run test:db`: 20 passing tests, including seven project tests. Covered correct ownership, validation, concurrent duplicates, same names across tenants, OWNER/ADMIN/MEMBER permissions, membership revocation, two-way known-ID isolation, and zero/one/multiple/stale/deleted selection. Temporary fixtures cleaned up.
  - `npm run test:actions`: seven passing tests, including four project action tests. Covered authentication redirects, forged ownership, cookie options, layout refresh, cross-workspace rejection, role denial, and sanitized unexpected failures.
  - `npx tsc --noEmit`, `npm run lint`, and `npm run build` passed.
  - Production HTTP smoke checks: `/app/overview`, `/app/projects`, and `/app/projects/new` returned 307 for unauthenticated requests. Temporary production server stopped.
  - Database tests required network access outside the sandbox; production build used the required process permissions.
- **Known issues:**
  - Browser connection returned no available browsers (confirmed by discovery). Authenticated end-to-end, visual, mobile, and keyboard checks remain unverified.
  - Existing installed Clerk template lint warning, parent-directory lockfile build warning, and Node experimental module-mock notices remain non-blocking.
- **Policy:** OWNER/ADMIN create; MEMBER views/selects. No permanent text-length limits. Case-sensitive per-workspace uniqueness follows the existing schema. No schema migration required.
- **Next unit:** Authenticated browser acceptance, then CSV Feedback Import.

### Onboarding Flow — 2026-09-11

- **Feature:** `feature-specs/03-onboarding-flow.md`, Stage A and durable completion query.
- **Status:** Stage A implemented. Full onboarding remains in progress pending the real CSV importer and authenticated browser acceptance.
- **Completed:**
  - Added server-only `resolveOnboardingState()` coordinating existing authenticated workspace/project preference resolution. States are WORKSPACE, PROJECT, FIRST_IMPORT, and COMPLETE; no browser step or completion flag is trusted or persisted.
  - Added a tenant/project-scoped import existence query requiring COMPLETED status and actual associated feedback in the same tenant/project. Empty, pending, processing, failed, and foreign imports do not complete setup. AI processing is not required.
  - Added the protected `/app/onboarding` Server Component route, focused branded shell, accessible three-step indicator, workspace/project forms, selection controls, pending-import state, loading skeleton, and retry boundary.
  - Reused existing creation forms, actions, services, validation, OWNER membership creation, and HttpOnly preference writes. Onboarding submissions return to server resolution; repeated submissions after persisted creation resume without creating additional resources. MEMBER project creation remains restricted.
  - Separated dashboard presentation into `(dashboard)` without changing public URLs. Shared `/app` authentication remains in place and pages/actions independently authenticate. Overview redirects incomplete setup to onboarding; existing project/workspace management stays accessible.
  - Completed users return to the existing overview for Stage A. The first-import success screen and Feedback Inbox destination remain Stage B work, as neither the importer nor inbox exists yet.
- **Files changed:** `src/server/onboarding/resolve-onboarding-state.ts`, `src/server/repositories/import-repository.ts`, `src/app/app/onboarding/*`, `src/app/app/(dashboard)/*`, authenticated app layout, workspace/project actions and shared forms, `src/components/onboarding/*`, `tests/onboarding.test.ts`, `package.json`, architecture/progress context. Existing uncommitted project work was preserved during route moves.
- **Verification:**
  - `npm run test:onboarding` passed: 10 database-backed scenarios plus the parent test. Actual services/actions exercised with mocked request/session boundaries; isolated database fixtures removed afterward.
  - Covered all four states, sign-out/sign-in and cookie-free resume, OWNER membership, validation failures, repeated submissions, missing parents, forged identity/ownership, two-way tenant preferences, scoped persisted feedback, failed imports, multiple/deleted projects, and revoked memberships.
  - `npm run test:db` passed: all 20 existing database tests.
  - `npm run test:actions` passed: all seven existing action tests.
  - TypeScript and lint passed; the existing installed Clerk template warning remains. Final production build passed with external process permissions.
  - Production HTTP checks for `/app/onboarding`, `/app/overview`, `/app/projects`, and `/app/workspaces/new` all returned 307 to `/sign-in` for anonymous requests. The temporary verification server was stopped afterward.
- **Known issues:**
  - Browser runtime discovery returned no connected browsers. Visual, mobile, keyboard, and authenticated end-to-end browser checks remain unverified.
  - Stage B cannot be connected until CSV Feedback Import works independently. The pending Import step is deliberately disabled and truthful; no temporary importer, fabricated feedback, or false completion is provided.
  - Existing parent-directory lockfile and Node module-mocking warnings remain non-blocking. No schema migration or dependency was added.
- **Next unit:** CSV Feedback Import, then onboarding Stage B and Feedback Inbox landing integration.

### CSV Import Execution and History — 2026-09-11

- **Feature:** `feature-specs/05-csv-import-execution-and-history.md`, units 1–9.
- **Status:** Implemented; server/database, action, TypeScript, lint and production-build verification passed. Authenticated browser acceptance remains outstanding; full visual/interaction verification is not claimed.
- **Completed:**
  - Reused canonical CSV parser, mapping, row validation and duplicate classification, with fresh authenticated OWNER/ADMIN project authorization at execution.
  - Server-issued execution UUIDs, unique attempt creation and conditional lifecycle claim prevent double confirmation, including feedback with no external ID. Retries return the persisted scoped outcome.
  - Import attempt survives transaction failure. Batch insertion and COMPLETED counters commit atomically; database uniqueness resolves concurrent external IDs, and failures retain safe messages with zero imported rows.
  - Used existing schema fields, with duplicate count derived from totalRows - invalidRows - validRows; final validRows equals committed importedRows. Blank source maps to `csv`; optional metadata remains nullable. No migration or dependency added.
  - Connected explicit Import feedback confirmation, pending state, persisted success/zero/failure results, retry guidance, latest-50 history, tenant/project-scoped detail and loading/error/empty states.
  - Added the required View feedback destination showing the latest 50 actual database rows. Full inbox search, filtering and detail are deferred to the next feature.
  - Shared onboarding importer now persists feedback and shows results. Only completed imports with actual feedback activate onboarding; completed users land in Feedback.
  - Preserved existing uncommitted work. Fixed a missing required source in existing CSV database fixtures and an existing JSX apostrophe lint error in the preview error boundary.
- **Files changed:** `src/server/services/feedback-import-service.ts`, import/feedback repositories, import preview/execution actions, feedback-import components, dashboard import/history/detail/feedback routes, navigation, onboarding/overview pages, `tests/import-execution.test.ts`, `tests/import-actions.test.ts`, CSV test fixtures, `package.json`, and architecture/progress context.
- **Verification:**
  - `npm run test:imports`: 9 passing tests (8 scenarios plus parent), including post-preview and insertion-time duplicate races, simultaneous confirmations, atomic rollback, trusted ownership, scoped history/detail, zero-row non-activation and permission denial. Temporary database fixtures cleaned up.
  - `npm run test:csv`: 12 passed; `npm run test:db`: 20 passed; `npm run test:actions`: 11 passed; `npm run test:onboarding`: 11 passed.
  - TypeScript passed; lint passed with only the existing installed Clerk template warning. Production build passed.
  - Production HTTP smoke checks: imports list/new/detail, feedback and onboarding all returned 307 to sign-in for anonymous requests. Temporary production server stopped.
- **Known issues:** Browser discovery returned no connected browsers; authenticated interaction, visual, mobile and keyboard checks remain unverified. Abrupt process termination or sustained database outage may leave a pending/processing attempt visible without a final result; automatic recovery/rerunning is outside this feature. Existing build lockfile and experimental test-mocking notices remain non-blocking.
- **Next unit:** Browser acceptance, then full Feedback Inbox.

### Feedback Inbox — 2026-09-11

- **Feature:** `feature-specs/06-feedback-inbox.md`, units 1–7.
- **Status:** Implemented; server/database, rendered UI, lint, TypeScript and production-build verification passed. Authenticated browser acceptance remains outstanding; full definition of done is not claimed.
- **Completed:**
  - Independently authenticated service operations and tenant/project-scoped list, detail, counts, source options, import options and import reference queries. Missing repository scope fails closed; foreign detail IDs remain unavailable.
  - Bounded 25-item keyset pages (repository clamps 1–50), stable newest-imported `createdAt DESC, id DESC` ordering and forward/backward navigation. Cursors validate structure and bind to project/filter state; changing filters resets pagination.
  - Case-insensitive literal substring search over original content, external ID and customer reference; escaped LIKE wildcard characters. Exact source, inclusive UTC occurrence-date and authorized import filters compose server-side.
  - Explicit GET search/filter form and URL state, clear/reset, responsive list, visually truncated previews, full original detail text, missing metadata markers, scoped import links and preserved inbox Back links.
  - Loading skeletons, retry error boundary using the installed Next.js `retry` API, unavailable detail, validation recovery, distinct empty/no-match states and permission-aware links to the existing importer. No AI fields or editing features.
  - Replaced the minimal latest-50 landing and removed its unused repository function. No dependency, migration or unrelated refactor introduced; existing uncommitted work preserved.
- **Files changed:** `src/app/app/(dashboard)/feedback/*`, `src/components/feedback/inbox.tsx`, `src/features/feedback/query.ts`, `src/server/repositories/{feedback-inbox-repository,feedback-repository}.ts`, `src/server/services/feedback-inbox-service.ts`, `tests/feedback-{inbox,ui}.test.ts`, `package.json`, architecture/progress context.
- **Verification:**
  - `npm run test:feedback`: 9 passed. Covered 40-row 25/15 pagination, tied timestamps, backward round-trip, page-size clamps, missing scope, all search fields, literal wildcards, date boundaries/nulls, combined filters, complete metadata, two-way tenant isolation, sibling-project denial, invalid inputs, cursor reset, revoked membership and unauthenticated denial. Temporary fixtures cleaned up.
  - `npm run test:feedback:ui`: 2 passed. Server rendering verifies HTML escaping, semantic filter controls, no cursor in filter submissions, stateful detail/back/pagination links, empty versus no-match states, and import permissions.
  - Regression suites: imports 9 passed; onboarding 11 passed; actions 11 passed.
  - TypeScript and lint passed (only the existing installed Clerk template warning). Production build passed after removing generated build/cache artifacts retaining the sandbox port-binding failure and using required process permissions.
  - Anonymous production requests to inbox, filtered inbox and detail returned HTTP 307 to sign-in. Temporary production server stopped. `git diff --check` passed.
- **Known issues:** Browser discovery returned no connected browsers. Signed-in browser interaction, visual, mobile and keyboard verification remain unverified. Existing parent-lockfile and experimental module-mock warnings remain non-blocking. Existing indexes retained; search/created-time index optimization should follow measured dataset needs.
- **Next unit:** Authenticated browser acceptance, then AI Feedback Classification as a separate feature.

### AI Feedback Classification — 2026-09-11

- **Feature:** `feature-specs/07-ai-feedback-classification.md`, units 1–8.
- **Status:** In progress.
- **Completed:** Unit 1 contract and Unit 3 deterministic normalization: exact enums, strict output keys, bounded topics/summary, duplicate/empty topic cleanup, rejection of long verbatim source copies. Engineering limits and persistence decisions documented in architecture context.
- **Files changed:** `src/server/ai/{schemas,classfication}/*`, `tests/classification-schema.test.ts`, architecture/progress context.
- **Verification:** Two schema/normalization tests passed. Full lint/type/build and integration checks pending.
- **Known issues:** Provider/model decision pending; no live classification has run.
- **Next unit:** Prompt/provider boundary, tenant-safe persistence, retry/failure behavior, and Inbox integration.
