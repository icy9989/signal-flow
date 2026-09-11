# Database setup

The app uses PostgreSQL, Prisma 7, and the Node.js PostgreSQL driver adapter.
Keep real credentials in `.env.local`; use `.env.example` as the reference.
Prisma commands and verification scripts use Next.js environment-file loading.

1. Configure `DATABASE_URL` with the runtime PostgreSQL connection. If your provider requires a direct connection for migrations, also configure `DIRECT_URL`.
2. Run `npm run db:deploy` to apply checked-in migrations to an empty or previously migrated database. The database must support pgvector and permit extension installation for the initial migration.
3. Run `npm run db:generate` after schema changes. Production builds generate the client automatically.
4. Run `npm run db:status`, `npm run db:check`, and `npm run test:db` to verify the setup. Integration tests use unique temporary identities inside rolled-back transactions; no test users remain.

Use `npm run db:migrate -- --name descriptive_name` to create future migrations against a development database with shadow-database support. Review generated SQL before deployment. Never use reset or accept-data-loss to work around a migration failure on a database containing data.

`getDb()` is the shared server-only client. Do not import the generated client into browser code or instantiate a client per request.

# Clerk connection

`requireApplicationUser()` authenticates through Clerk and synchronizes the verified primary email, name, and image into `User`, keyed by Clerk's ID in `externalAuthId`. The local `User.id` is the stable key for memberships and imports. It runs when the protected application layout renders; future protected operations should call it directly before checking organization authorization.

Synchronization is access-time and requires a verified primary email. Repeated entry updates the same record. Different Clerk identities are never merged by email. Profile updates appear at the next server entry; no webhook endpoint or public callback is needed for this feature.

Clerk account deletion prevents further authenticated access but does not delete local audit records. Account retention/deletion and event-driven mirroring require a separate defined workflow. Authentication does not grant access to an organization: membership and role checks must be added with workspace features.

For a manual end-to-end check, sign in at `/sign-in`, open `/app/overview`, and inspect the `User` table with `npm run db:studio`. Refresh and confirm the same local user remains. Sign out and confirm `/app/overview` redirects to sign-in.

### Workspace verification

- `npm run test:db` includes workspace persistence, atomicity, slug concurrency, membership resolution, and bidirectional tenant-isolation tests. Workspace tests create uniquely identified temporary users/workspaces in the configured development database and clean up those fixtures afterward.
- `npm run test:actions` verifies the workspace action and cookie flow with mocked request/session/database boundaries, without a database connection. Tested on Node 24.19; the Node module-mocking API requires its experimental flag (included in the command).
- Authenticated browser acceptance remains separate: sign in, create a workspace from onboarding, confirm the active name and empty project state, create a second workspace, and switch between them. Repeat at mobile width and with keyboard navigation.
