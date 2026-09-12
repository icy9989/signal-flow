import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { getDb } from "../src/server/db/client";
import { createOrganizationService, OrganizationError } from "../src/server/services/organization-service";
import { createProjectService, ProjectError } from "../src/server/services/project-service";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
const db = getDb();
const prefix = `project-test-${randomUUID()}`;
const users: string[] = [];
const orgs: string[] = [];
const projects: string[] = [];
const service = (id: string) => createProjectService({
  requireMembership: createOrganizationService({ requireUser: async () => ({ id }), database: () => db }).requireOrganizationMembership,
  database: () => db,
});
before(async () => {
  for (const suffix of ["a", "b"]) {
    const user = await db.user.create({ data: { externalAuthId: `${prefix}-${suffix}`, email: `${prefix}-${suffix}@example.com` } });
    users.push(user.id);
    const org = await db.organization.create({ data: { name: prefix, slug: `${prefix}-${suffix}`, memberships: { create: { userId: user.id, role: "OWNER" } } } });
    orgs.push(org.id);
    const project = await db.project.create({ data: { organizationId: org.id, name: "Product" } });
    projects.push(project.id);
  }
});
after(async () => {
  await db.organization.deleteMany({ where: { id: { in: orgs } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});
const unavailable = (error: unknown) => error instanceof ProjectError && error.code === "PROJECT_NOT_FOUND" && error.message === "Project unavailable.";
test("project access checks membership and denies known cross-tenant IDs in both directions", async () => {
  for (const [own, other] of [[0, 1], [1, 0]]) {
    assert.equal((await service(users[own]).requireProjectAccess({ organizationId: orgs[own], projectId: projects[own] })).project.id, projects[own]);
    await assert.rejects(service(users[own]).requireProjectAccess({ organizationId: orgs[own], projectId: projects[other] }), unavailable);
    await assert.rejects(service(users[own]).requireProjectAccess({ organizationId: orgs[other], projectId: projects[other] }), OrganizationError);
    await assert.rejects(service(users[own]).requireProjectAccess({ organizationId: orgs[own], projectId: "missing" }), unavailable);
  }
});
test("listing and active selection stay inside the authorized organization", async () => {
  assert.deepEqual((await service(users[0]).listProjectsForOrganization({ organizationId: orgs[0] })).map(p => p.id), [projects[0]]);
  assert.equal((await service(users[0]).resolveActiveProject({ organizationId: orgs[0], preference: projects[1] })).active?.project.id, projects[0]);
  await assert.rejects(service(users[0]).switchActiveProject({ organizationId: orgs[0], projectId: projects[1] }), unavailable);
});

test("creation derives ownership, trims input, and preserves optional descriptions", async () => {
  const project = await service(users[0]).createProjectForOrganization({ organizationId: orgs[0], input: { name: "  Mobile App  ", description: "  Mobile feedback  ", organizationId: orgs[1] } });
  assert.equal(project.name, "Mobile App");
  assert.equal(project.description, "Mobile feedback");
  assert.equal((await db.project.findFirst({ where: { id: project.id, organizationId: orgs[0] } }))?.organizationId, orgs[0]);
  const blank = await service(users[0]).createProjectForOrganization({ organizationId: orgs[0], input: { name: "Blank description", description: "  " } });
  assert.equal(blank.description, null);
  const absent = await service(users[0]).createProjectForOrganization({ organizationId: orgs[0], input: { name: "Absent description" } });
  assert.equal(absent.description, null);
});

test("creation rejects invalid input and unauthorized workspaces", async () => {
  for (const input of [{}, { name: " " }, { name: 123 }, { name: "Valid", description: 123 }]) {
    await assert.rejects(service(users[0]).createProjectForOrganization({ organizationId: orgs[0], input }), error => error instanceof ProjectError && error.code === "VALIDATION_ERROR");
  }
  await assert.rejects(service(users[0]).createProjectForOrganization({ organizationId: orgs[1], input: { name: "Forbidden" } }), OrganizationError);
});

test("database uniqueness rejects concurrent duplicate names but allows separate organizations", async () => {
  const results = await Promise.allSettled([0, 1].map(() => service(users[0]).createProjectForOrganization({ organizationId: orgs[0], input: { name: "Concurrent" } })));
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  const rejected = results.find(result => result.status === "rejected");
  assert.ok(rejected?.status === "rejected" && rejected.reason instanceof ProjectError);
  assert.equal(rejected.reason.code, "PROJECT_NAME_CONFLICT");
  assert.equal(rejected.reason.message, "A project with this name already exists in this workspace.");
  assert.equal((await service(users[1]).createProjectForOrganization({ organizationId: orgs[1], input: { name: "Concurrent" } })).name, "Concurrent");
});

test("members can list and select, admins can create, and revoked membership fails closed", async () => {
  const membership = await db.organizationMember.create({ data: { organizationId: orgs[0], userId: users[1], role: "MEMBER" } });
  try {
    assert.ok((await service(users[1]).listProjectsForOrganization({ organizationId: orgs[0] })).length > 0);
    assert.equal((await service(users[1]).switchActiveProject({ organizationId: orgs[0], projectId: projects[0] })).project.id, projects[0]);
    await assert.rejects(service(users[1]).createProjectForOrganization({ organizationId: orgs[0], input: { name: "Member project" } }), error => error instanceof ProjectError && error.code === "FORBIDDEN");
    await db.organizationMember.update({ where: { id: membership.id }, data: { role: "ADMIN" } });
    assert.equal((await service(users[1]).createProjectForOrganization({ organizationId: orgs[0], input: { name: "Admin project" } })).name, "Admin project");
  } finally {
    await db.organizationMember.delete({ where: { id: membership.id } });
  }
  await assert.rejects(service(users[1]).resolveActiveProject({ organizationId: orgs[0], preference: projects[0] }), OrganizationError);
});

test("zero, one, and multiple projects resolve safely, including deleted and cross-workspace preferences", async () => {
  const org = await db.organization.create({ data: { name: prefix, slug: `${prefix}-empty`, memberships: { create: { userId: users[0], role: "OWNER" } } } });
  orgs.push(org.id);
  const resolve = (preference?: string) => service(users[0]).resolveActiveProject({ organizationId: org.id, preference });
  assert.deepEqual((await resolve()).projects, []);
  assert.equal((await resolve(projects[1])).active, null);
  const first = await service(users[0]).createProjectForOrganization({ organizationId: org.id, input: { name: "First" } });
  assert.equal((await resolve()).active?.project.id, first.id);
  const second = await service(users[0]).createProjectForOrganization({ organizationId: org.id, input: { name: "Second" } });
  assert.equal((await resolve(first.id)).active?.project.id, first.id);
  assert.equal((await resolve(second.id)).active?.project.id, second.id);
  assert.equal((await resolve(projects[1])).active?.project.id, second.id);
  await db.project.delete({ where: { id: second.id } });
  assert.equal((await resolve(second.id)).active?.project.id, first.id);
});
