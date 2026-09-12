import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, mock, test } from "node:test";
import { getDb } from "../src/server/db/client";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
const db = getDb();
const prefix = `onboarding-test-${randomUUID()}`;
const users: string[] = [];
const preferences = new Map<string, string>();
let currentUser: string | null = null;
class Redirect extends Error {}

mock.module("../src/server/auth/require-application-user.ts", { namedExports: {
  requireApplicationUser: async () => {
    if (!currentUser) throw new Redirect("sign-in");
    return { id: currentUser };
  },
} });
mock.module("next/headers", { namedExports: { cookies: async () => ({
  get: (name: string) => preferences.has(name) ? { value: preferences.get(name) } : undefined,
  set: (name: string, value: string) => { preferences.set(name, value); },
}) } });
mock.module("next/cache", { namedExports: { revalidatePath: () => {} } });
mock.module("next/navigation", { namedExports: {
  redirect: (path: string) => { throw new Redirect(path); },
  unstable_rethrow: (error: unknown) => { if (error instanceof Redirect) throw error; },
} });

let resolve: typeof import("../src/server/onboarding/resolve-onboarding-state").resolveOnboardingState;
let createWorkspace: typeof import("../src/app/app/workspace-actions").createWorkspaceAction;
let createProject: typeof import("../src/app/app/project-actions").createProjectAction;
let switchProject: typeof import("../src/app/app/project-actions").switchProjectAction;
let switchWorkspace: typeof import("../src/app/app/workspace-actions").switchWorkspaceAction;

before(async () => {
  for (const suffix of ["a", "b"]) {
    const user = await db.user.create({ data: { externalAuthId: `${prefix}-${suffix}`, email: `${prefix}-${suffix}@example.com` } });
    users.push(user.id);
  }
  ({ resolveOnboardingState: resolve } = await import("../src/server/onboarding/resolve-onboarding-state"));
  ({ createWorkspaceAction: createWorkspace, switchWorkspaceAction: switchWorkspace } = await import("../src/app/app/workspace-actions"));
  ({ createProjectAction: createProject, switchProjectAction: switchProject } = await import("../src/app/app/project-actions"));
});
after(async () => {
  await db.organization.deleteMany({ where: { memberships: { some: { userId: { in: users } } } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});
function form(values: Record<string, string>) {
  const data = new FormData();
  data.set("flow", "onboarding");
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
const onboardingRedirect = (error: unknown) => error instanceof Redirect && error.message === "/app/onboarding";

test("onboarding derives durable progress through the real services and tenant-scoped import query", async (t) => {
  await t.test("authentication precedes state resolution and mutations", async () => {
    await assert.rejects(resolve(), Redirect);
    await assert.rejects(createWorkspace({}, form({ name: prefix })), Redirect);
    await assert.rejects(createProject({}, form({ name: "Product" })), Redirect);
  });

  currentUser = users[0];
  await t.test("new user cannot skip parents or trust browser completion flags", async () => {
    assert.equal((await resolve()).step, "WORKSPACE");
    assert.equal((await createProject({}, form({ name: "Product", organizationId: "forged", onboardingComplete: "true" }))).error?.code, "NOT_FOUND");
    assert.equal((await resolve()).step, "WORKSPACE");
    assert.equal((await createWorkspace({}, form({ name: " " }))).error?.code, "VALIDATION_ERROR");
  });

  await assert.rejects(createWorkspace({}, form({ name: prefix, userId: users[1], role: "MEMBER" })), onboardingRedirect);
  const organization = (await resolve()).organization!;
  await t.test("workspace creation is durable, establishes OWNER, and repeat submissions resume", async () => {
    assert.equal((await resolve()).step, "PROJECT");
    const membership = await db.organizationMember.findUniqueOrThrow({ where: { organizationId_userId: { organizationId: organization.id, userId: users[0] } } });
    assert.equal(membership.role, "OWNER");
    await assert.rejects(createWorkspace({}, form({ name: `${prefix}-retry` })), onboardingRedirect);
    assert.equal(await db.organizationMember.count({ where: { userId: users[0] } }), 1);
    assert.equal((await createProject({}, form({ name: " " }))).error?.code, "VALIDATION_ERROR");
    assert.equal((await resolve()).step, "PROJECT");
  });

  await assert.rejects(createProject({}, form({ name: "Product", organizationId: "forged" })), onboardingRedirect);
  const project = (await resolve()).project!;
  await t.test("project creation resumes at import, with no duplicates on resubmission", async () => {
    assert.equal((await resolve()).step, "FIRST_IMPORT");
    assert.equal((await db.project.findUniqueOrThrow({ where: { id: project.id } })).organizationId, organization.id);
    await assert.rejects(createProject({}, form({ name: "Retry" })), onboardingRedirect);
    assert.equal(await db.project.count({ where: { organizationId: organization.id } }), 1);
    currentUser = null;
    await assert.rejects(resolve(), Redirect);
    currentUser = users[0];
    preferences.clear();
    assert.equal((await resolve()).step, "FIRST_IMPORT");
  });

  const imported = await db.feedbackImport.create({ data: { organizationId: organization.id, projectId: project.id, createdById: users[0], fileName: "test.csv" } });
  await t.test("pending, processing, failed, and empty completed imports do not activate", async () => {
    for (const status of ["PENDING", "PROCESSING", "FAILED", "COMPLETED"] as const) {
      await db.feedbackImport.update({ where: { id: imported.id }, data: { status } });
      assert.equal((await resolve()).step, "FIRST_IMPORT");
      assert.equal((await resolve()).project?.id, project.id);
    }
  });

  await t.test("completed import plus persisted feedback activates without AI processing", async () => {
    await db.feedback.create({ data: { organizationId: organization.id, projectId: project.id, importId: imported.id, source: "test", content: "Test feedback" } });
    assert.equal((await resolve()).step, "COMPLETE");
    await db.feedbackImport.update({ where: { id: imported.id }, data: { status: "FAILED" } });
    assert.equal((await resolve()).step, "FIRST_IMPORT");
    await db.feedbackImport.update({ where: { id: imported.id }, data: { status: "COMPLETED" } });
  });

  currentUser = users[1];
  await t.test("other tenant preferences cannot provide a workspace or satisfy activation", async () => {
    preferences.set("signalflow-workspace", organization.id);
    preferences.set("signalflow-project", project.id);
    const state = await resolve();
    assert.equal(state.step, "WORKSPACE");
    assert.equal(state.organization, null);
    assert.equal(state.project, null);
    assert.equal((await switchWorkspace({}, form({ organizationId: organization.id }))).error?.code, "NOT_FOUND");
  });
  await assert.rejects(createWorkspace({}, form({ name: `${prefix}-b` })), onboardingRedirect);
  await assert.rejects(createProject({}, form({ name: "Other product" })), onboardingRedirect);
  const other = await resolve();

  await t.test("stale or foreign preferences fall back safely; foreign imports and feedback never count", async () => {
    preferences.set("signalflow-workspace", organization.id);
    preferences.set("signalflow-project", project.id);
    assert.equal((await resolve()).step, "FIRST_IMPORT");
    assert.equal((await resolve()).project?.id, other.project?.id);
    assert.equal((await switchProject({}, form({ projectId: project.id }))).error?.code, "PROJECT_NOT_FOUND");
    // The schema has independent FKs; even inconsistent fixture ownership must fail closed.
    const malformed = await db.feedbackImport.create({ data: { organizationId: other.organization!.id, projectId: other.project!.id, createdById: users[1], fileName: "inconsistent.csv", status: "COMPLETED" } });
    await db.feedback.create({ data: { organizationId: organization.id, projectId: project.id, importId: malformed.id, source: "test", content: "Wrong tenant" } });
    assert.equal((await resolve()).step, "FIRST_IMPORT");
    currentUser = users[0];
    preferences.set("signalflow-workspace", other.organization!.id);
    preferences.set("signalflow-project", other.project!.id);
    assert.equal((await resolve()).step, "COMPLETE");
    assert.equal((await resolve()).project?.id, project.id);
  });

  await t.test("switching to a project with no import does not inherit another project's completion", async () => {
    const second = await db.project.create({ data: { organizationId: organization.id, name: "Second" } });
    preferences.set("signalflow-project", second.id);
    assert.equal((await resolve()).step, "FIRST_IMPORT");
    await db.project.delete({ where: { id: second.id } });
    assert.equal((await resolve()).step, "COMPLETE");
  });

  await t.test("revoked membership cannot resume saved setup", async () => {
    currentUser = users[1];
    await db.organizationMember.delete({ where: { organizationId_userId: { organizationId: other.organization!.id, userId: users[1] } } });
    try {
      assert.equal((await resolve()).step, "WORKSPACE");
    } finally {
      await db.organizationMember.create({ data: { organizationId: other.organization!.id, userId: users[1], role: "OWNER" } });
    }
  });
});
