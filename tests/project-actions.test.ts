import assert from "node:assert/strict";
import { before, mock, test } from "node:test";

let signedIn = true;
let role = "OWNER";
let workspace = "org-a";
let failDatabase = false;
const cookies = new Map<string, string>();
const writes: unknown[][] = [];
const refreshes: string[] = [];
const projects = [{ id: "project-b", organizationId: "org-b", name: "Other tenant", description: null as string | null }];
class Redirect extends Error {}
mock.module("../src/server/auth/require-application-user.ts", { namedExports: {
  requireApplicationUser: async () => { if (!signedIn) throw new Redirect("sign-in"); return { id: "user-a" }; },
} });
mock.module("next/headers", { namedExports: { cookies: async () => ({
  get: (name: string) => cookies.has(name) ? { value: cookies.get(name) } : undefined,
  set: (...args: unknown[]) => { writes.push(args); cookies.set(String(args[0]), String(args[1])); },
}) } });
mock.module("next/cache", { namedExports: { revalidatePath: (path: string, type: string) => refreshes.push(`${path}:${type}`) } });
mock.module("next/navigation", { namedExports: {
  redirect: (path: string) => { throw new Redirect(path); },
  unstable_rethrow: (error: unknown) => { if (error instanceof Redirect) throw error; },
} });
mock.module("../src/server/db/client.ts", { namedExports: { getDb: () => ({
  organizationMember: {
    findMany: async () => [{ id: "membership", role, organization: { id: workspace, name: "Workspace", slug: workspace } }],
    findUnique: async ({ where }: { where: { organizationId_userId: { organizationId: string; userId: string } } }) => where.organizationId_userId.organizationId === workspace && where.organizationId_userId.userId === "user-a" ? { id: "membership", role, organization: { id: workspace, name: "Workspace", slug: workspace } } : null,
  },
  project: {
    create: async ({ data }: { data: { organizationId: string; name: string; description?: string } }) => {
      if (failDatabase) throw new Error("private database details");
      const project = { ...data, description: data.description ?? null, id: `project-${projects.length}` };
      projects.push(project);
      return project;
    },
    findFirst: async ({ where }: { where: { id: string; organizationId: string } }) => projects.find(p => p.id === where.id && p.organizationId === where.organizationId) ?? null,
    findMany: async ({ where }: { where: { organizationId: string } }) => projects.filter(p => p.organizationId === where.organizationId),
  },
}) } });
let createProjectAction: typeof import("../src/app/app/project-actions").createProjectAction;
let switchProjectAction: typeof import("../src/app/app/project-actions").switchProjectAction;
let resolveProjectWorkspace: typeof import("../src/server/auth/project-context").resolveProjectWorkspace;
before(async () => {
  ({ createProjectAction, switchProjectAction } = await import("../src/app/app/project-actions"));
  ({ resolveProjectWorkspace } = await import("../src/server/auth/project-context"));
});
const form = (values: Record<string, string>) => { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; };

test("project actions preserve authentication redirects before database or cookie writes", async () => {
  signedIn = false;
  await assert.rejects(createProjectAction({}, form({ name: "Project" })), Redirect);
  await assert.rejects(switchProjectAction({}, form({ projectId: "project-b" })), Redirect);
  assert.equal(projects.length, 1);
  assert.equal(writes.length, 0);
  signedIn = true;
});

test("creation validates and ignores forged ownership, then selects and refreshes the new project", async () => {
  assert.equal((await createProjectAction({}, form({ name: " " }))).error?.code, "VALIDATION_ERROR");
  assert.equal(writes.length, 0);
  await assert.rejects(createProjectAction({}, form({ name: " Mobile ", description: " Feedback ", organizationId: "org-b", role: "ADMIN" })), error => error instanceof Redirect && error.message === "/app/overview?created=1");
  assert.equal(projects[1].organizationId, "org-a");
  assert.equal(projects[1].name, "Mobile");
  assert.equal(projects[1].description, "Feedback");
  assert.deepEqual(writes[0], ["signalflow-project", projects[1].id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/app", maxAge: 2592000 }]);
  assert.equal(refreshes.at(-1), "/app:layout");
  assert.equal((await resolveProjectWorkspace()).activeProject?.project.id, projects[1].id);
});

test("switches reject cross-workspace IDs without writes and revalidate stale workspace preferences", async () => {
  const count = writes.length;
  const result = await switchProjectAction({}, form({ projectId: "project-b", organizationId: "org-b" }));
  assert.equal(result.error?.code, "PROJECT_NOT_FOUND");
  assert.equal(result.error?.message, "Project unavailable.");
  assert.equal(writes.length, count);
  await assert.rejects(switchProjectAction({}, form({ projectId: projects[1].id })), error => error instanceof Redirect && error.message === "/app/overview");
  workspace = "org-b";
  assert.equal((await resolveProjectWorkspace()).activeProject?.project.id, "project-b");
  workspace = "org-a";
});

test("member creation is denied and unexpected errors are sanitized", async () => {
  role = "MEMBER";
  const count = writes.length;
  assert.equal((await createProjectAction({}, form({ name: "Denied" }))).error?.code, "FORBIDDEN");
  assert.equal(writes.length, count);
  role = "OWNER";
  failDatabase = true;
  const result = await createProjectAction({}, form({ name: "Failure" }));
  assert.equal(result.error?.code, "INTERNAL_ERROR");
  assert.ok(!JSON.stringify(result).includes("private database details"));
  assert.equal(writes.length, count);
  failDatabase = false;
});
