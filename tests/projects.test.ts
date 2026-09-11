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
