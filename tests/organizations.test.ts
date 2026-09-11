import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { getDb } from "../src/server/db/client";
import { createOrganizationService, OrganizationError } from "../src/server/services/organization-service";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
const db = getDb();
const prefix = `workspace-test-${randomUUID()}`;
const users: string[] = [];
let userA: string;
let userB: string;
const service = (id: string) => createOrganizationService({ requireUser: async () => ({ id }), database: () => db });

before(async () => {
  for (const suffix of ["a", "b"]) {
    const user = await db.user.create({ data: { externalAuthId: `${prefix}-${suffix}`, email: `${prefix}-${suffix}@example.com` } });
    users.push(user.id);
  }
  [userA, userB] = users;
});

after(async () => {
  // Delete only records uniquely owned by this test run; no application users are touched.
  await db.organization.deleteMany({ where: { memberships: { some: { userId: { in: users } } } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

const unavailable = (error: unknown) => error instanceof OrganizationError && error.code === "NOT_FOUND" && error.message === "Workspace unavailable.";

test("zero memberships returns onboarding without an active organization", async () => {
  assert.deepEqual(await service(userA).resolveActiveOrganization("forged-id"), { memberships: [], active: null });
});

test("creation persists a trimmed name and exactly one server-assigned owner; untrusted identity and role are ignored", async () => {
  const organization = await service(userA).createOrganizationForUser({ name: `  ${prefix} Acme Inc.  `, userId: userB, ownerId: userB, role: "ADMIN", organizationId: "forged", slug: "forged" });
  assert.equal(organization.name, `${prefix} Acme Inc.`);
  assert.equal(organization.slug, `${prefix}-acme-inc`);
  const members = await db.organizationMember.findMany({ where: { organizationId: organization.id } });
  assert.equal(members.length, 1);
  assert.equal(members[0].userId, userA);
  assert.equal(members[0].role, "OWNER");
  assert.equal((await service(userA).resolveActiveOrganization()).active?.organization.id, organization.id);
});

test("invalid names fail before persistence and the approved 100-character boundary is accepted", async () => {
  const count = await db.organizationMember.count({ where: { userId: userA } });
  for (const name of [undefined, null, 123, "", "   ", "x".repeat(101)]) {
    await assert.rejects(service(userA).createOrganizationForUser({ name }), (error) => error instanceof OrganizationError && error.code === "VALIDATION_ERROR");
  }
  assert.equal(await db.organizationMember.count({ where: { userId: userA } }), count);
  const organization = await service(userA).createOrganizationForUser({ name: `${prefix}${"x".repeat(100 - prefix.length)}` });
  assert.equal(organization.name.length, 100);
});

test("owner foreign-key failure rolls the organization back atomically", async () => {
  const name = `${prefix}-rollback`;
  await assert.rejects(service(`missing-${randomUUID()}`).createOrganizationForUser({ name }));
  assert.equal(await db.organization.count({ where: { name } }), 0);
});

test("competing duplicate names succeed with distinct stable URL-safe slugs", async () => {
  const name = `${prefix}-race`;
  const organizations = await Promise.all(Array.from({ length: 8 }, () => service(userA).createOrganizationForUser({ name })));
  assert.equal(new Set(organizations.map(({ slug }) => slug)).size, 8);
  for (const organization of organizations) {
    assert.match(organization.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(await db.organizationMember.count({ where: { organizationId: organization.id, userId: userA, role: "OWNER" } }), 1);
    assert.equal((await service(userA).requireOrganizationMembership({ organizationId: organization.id })).organization.slug, organization.slug);
  }
});

test("non-ASCII and punctuation-only names receive safe nonempty slugs", async () => {
  for (const name of ["日本語", "!!!"]) {
    const organization = await service(userA).createOrganizationForUser({ name });
    assert.match(organization.slug, /^workspace(?:-[a-z0-9-]+)?$/);
    assert.equal(organization.name, name);
  }
});

test("A can access A and B can access B, while both cross-tenant directions fail identically to unknown IDs", async () => {
  const organizationA = await service(userA).createOrganizationForUser({ name: `${prefix}-private-a` });
  const organizationB = await service(userB).createOrganizationForUser({ name: `${prefix}-private-b` });
  assert.equal((await service(userA).requireOrganizationMembership({ organizationId: organizationA.id })).user.id, userA);
  assert.equal((await service(userB).requireOrganizationMembership({ organizationId: organizationB.id })).user.id, userB);
  await assert.rejects(service(userA).requireOrganizationMembership({ organizationId: organizationB.id }), unavailable);
  await assert.rejects(service(userB).requireOrganizationMembership({ organizationId: organizationA.id }), unavailable);
  await assert.rejects(service(userA).requireOrganizationMembership({ organizationId: "does-not-exist" }), unavailable);
  const membershipsA = await service(userA).listOrganizationsForUser();
  assert.ok(membershipsA.every(({ organization }) => organization.id !== organizationB.id));
  assert.deepEqual((await service(userB).listOrganizationsForUser()).map(({ organization }) => organization.id), [organizationB.id]);
  const stale = await service(userB).resolveActiveOrganization(organizationA.id);
  assert.equal(stale.active?.organization.id, organizationB.id);
});

test("multiple workspace selection is revalidated and stale or revoked selection falls back safely", async () => {
  const first = await service(userA).resolveActiveOrganization();
  const last = first.memberships.at(-1)!;
  assert.equal((await service(userA).resolveActiveOrganization(last.organization.id)).active?.organization.id, last.organization.id);
  assert.equal((await service(userA).resolveActiveOrganization("stale")).active?.organization.id, first.active?.organization.id);
  const temporary = await service(userA).createOrganizationForUser({ name: `${prefix}-revoked` });
  // Keep an owner for deterministic fixture cleanup after A's membership is revoked.
  await db.organizationMember.create({ data: { organizationId: temporary.id, userId: userB, role: "OWNER" } });
  await db.organizationMember.delete({ where: { organizationId_userId: { organizationId: temporary.id, userId: userA } } });
  await assert.rejects(service(userA).requireOrganizationMembership({ organizationId: temporary.id }), unavailable);
  assert.notEqual((await service(userA).resolveActiveOrganization(temporary.id)).active?.organization.id, temporary.id);
});

test("database roles grant membership but cannot satisfy a higher-role requirement", async () => {
  const organization = await service(userA).createOrganizationForUser({ name: `${prefix}-roles` });
  await db.organizationMember.create({ data: { organizationId: organization.id, userId: userB, role: "MEMBER" } });
  assert.equal((await service(userB).requireOrganizationMembership({ organizationId: organization.id })).membership.role, "MEMBER");
  await assert.rejects(service(userB).requireOrganizationRole({ organizationId: organization.id, roles: ["OWNER", "ADMIN"] }), unavailable);
  assert.equal((await service(userA).requireOrganizationRole({ organizationId: organization.id, roles: ["OWNER"] })).membership.role, "OWNER");
});

test("every service entry independently requires authentication before database access", async () => {
  let authentications = 0;
  const unauthenticated = createOrganizationService({
    requireUser: async () => { authentications++; throw new Error("Unauthenticated"); },
    database: () => { throw new Error("Database must not be accessed"); },
  });
  for (const operation of [
    () => unauthenticated.listOrganizationsForUser(),
    () => unauthenticated.resolveActiveOrganization("forged"),
    () => unauthenticated.requireOrganizationMembership({ organizationId: "forged" }),
    () => unauthenticated.requireOrganizationRole({ organizationId: "forged", roles: ["OWNER"] }),
    () => unauthenticated.createOrganizationForUser({ name: "Example", userId: userA }),
  ]) await assert.rejects(operation(), { message: "Unauthenticated" });
  assert.equal(authentications, 5);
});
