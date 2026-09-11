import assert from "node:assert/strict";
import { before, mock, test } from "node:test";

let currentUser: { id: string } | null = { id: "user-a" };
const redirects: string[] = [];
const refreshes: string[] = [];
const writes: unknown[][] = [];
const organizations: { id: string; name: string; slug: string; userId: string }[] = [];
let cookie: string | undefined;
class Redirect extends Error {}

mock.module("../src/server/auth/require-application-user.ts", { namedExports: {
  requireApplicationUser: async () => { if (!currentUser) throw new Redirect("sign-in"); return currentUser; },
} });
mock.module("next/headers", { namedExports: { cookies: async () => ({
  get: () => cookie ? { value: cookie } : undefined,
  set: (...args: unknown[]) => { writes.push(args); cookie = String(args[1]); },
}) } });
mock.module("next/cache", { namedExports: { revalidatePath: (path: string, type: string) => refreshes.push(`${path}:${type}`) } });
mock.module("next/navigation", { namedExports: {
  redirect: (path: string) => { redirects.push(path); throw new Redirect(path); },
  unstable_rethrow: (error: unknown) => { if (error instanceof Redirect) throw error; },
} });
mock.module("../src/server/db/client.ts", { namedExports: { getDb: () => ({
  organization: { create: async ({ data }: { data: { name: string; slug: string; memberships: { create: { userId: string; role: string } } } }) => {
    assert.equal(data.memberships.create.role, "OWNER");
    const organization = { id: `org-${organizations.length}`, name: data.name, slug: data.slug, userId: data.memberships.create.userId };
    organizations.push(organization);
    return organization;
  } },
  organizationMember: {
    findUnique: async ({ where }: { where: { organizationId_userId: { organizationId: string; userId: string } } }) => {
      const scope = where.organizationId_userId;
      const organization = organizations.find(({ id, userId }) => id === scope.organizationId && userId === scope.userId);
      return organization ? { id: "membership", role: "OWNER", organization } : null;
    },
    findMany: async ({ where }: { where: { userId: string } }) => organizations.filter(({ userId }) => userId === where.userId).map((organization) => ({ id: `membership-${organization.id}`, role: "OWNER", organization })),
  },
}) } });

let createWorkspaceAction: typeof import("../src/app/app/workspace-actions").createWorkspaceAction;
let switchWorkspaceAction: typeof import("../src/app/app/workspace-actions").switchWorkspaceAction;
let resolveActiveOrganization: typeof import("../src/server/auth/organization-context").resolveActiveOrganization;
before(async () => {
  ({ createWorkspaceAction, switchWorkspaceAction } = await import("../src/app/app/workspace-actions"));
  ({ resolveActiveOrganization } = await import("../src/server/auth/organization-context"));
});
const form = (values: Record<string, string>) => { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; };

test("actions preserve sign-in redirects and cannot write before authentication", async () => {
  currentUser = null;
  await assert.rejects(createWorkspaceAction({}, form({ name: "Workspace" })), Redirect);
  await assert.rejects(switchWorkspaceAction({}, form({ organizationId: "forged" })), Redirect);
  assert.equal(organizations.length, 0);
  assert.equal(writes.length, 0);
  currentUser = { id: "user-a" };
});

test("creation validates the server input, then sets a checked HttpOnly cookie and refreshes the layout", async () => {
  const invalid = await createWorkspaceAction({}, form({ name: "  " }));
  assert.equal(invalid.error?.code, "VALIDATION_ERROR");
  assert.equal(writes.length, 0);
  await assert.rejects(createWorkspaceAction({}, form({ name: "Acme", userId: "user-b", role: "ADMIN" })), Redirect);
  assert.equal(organizations[0].userId, "user-a");
  assert.equal(writes[0][0], "signalflow-workspace");
  assert.equal(writes[0][1], organizations[0].id);
  assert.deepEqual(writes[0][2], { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/app", maxAge: 2592000 });
  assert.equal(refreshes.at(-1), "/app:layout");
  assert.equal(redirects.at(-1), "/app/overview");
});

test("switching validates membership, persists selection, and reloads organization context", async () => {
  await assert.rejects(createWorkspaceAction({}, form({ name: "Second" })), Redirect);
  assert.equal((await resolveActiveOrganization()).active?.organization.name, "Second");
  await assert.rejects(switchWorkspaceAction({}, form({ organizationId: organizations[0].id })), Redirect);
  assert.equal((await resolveActiveOrganization()).active?.organization.name, "Acme");
  assert.equal(refreshes.at(-1), "/app:layout");
  assert.equal(redirects.at(-1), "/app/overview");
  const count = writes.length;
  const inaccessible = await switchWorkspaceAction({}, form({ organizationId: "another-tenant", userId: "user-b", role: "OWNER" }));
  assert.equal(inaccessible.error?.code, "NOT_FOUND");
  assert.equal(inaccessible.error?.message, "Workspace unavailable.");
  assert.equal(writes.length, count);
  cookie = "stale-or-forged";
  assert.equal((await resolveActiveOrganization()).active?.organization.name, "Acme");
  currentUser = { id: "user-b" };
  assert.equal((await resolveActiveOrganization()).active, null);
  assert.equal((await switchWorkspaceAction({}, form({ organizationId: organizations[0].id }))).error?.code, "NOT_FOUND");
});
