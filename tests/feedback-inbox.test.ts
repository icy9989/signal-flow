import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { getDb } from "../src/server/db/client";
import { listFeedback, getFeedback } from "../src/server/repositories/feedback-inbox-repository";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
test("feedback pages are bounded, stable and isolated", async () => {
  const db = getDb();
  const prefix = `inbox-${randomUUID()}`;
  const org = await db.organization.create({ data: { name: prefix, slug: prefix } });
  try {
    const project = await db.project.create({ data: { organizationId: org.id, name: "Inbox" } });
    const scope = { organizationId: org.id, projectId: project.id };
    await db.feedback.createMany({ data: Array.from({ length: 40 }, (_, i) => ({ ...scope, id: `${prefix}-${String(i).padStart(2, "0")}`, content: `Message ${i}`, source: "Support", createdAt: new Date("2026-09-11T12:00:00Z") })) });
    const first = await listFeedback(db, scope);
    assert.equal(first.items.length, 25);
    assert.equal(first.hasNext, true);
    const last = first.items.at(-1)!;
    const second = await listFeedback(db, scope, { position: { id: last.id, createdAt: last.createdAt.toISOString(), direction: "next" } });
    assert.equal(second.items.length, 15);
    assert.equal(second.hasNext, false);
    assert.equal(new Set([...first.items, ...second.items].map(row => row.id)).size, 40);
    const back = await listFeedback(db, scope, { position: { id: second.items[0].id, createdAt: second.items[0].createdAt.toISOString(), direction: "previous" } });
    assert.deepEqual(back.items, first.items);
    await db.feedback.createMany({ data: Array.from({ length: 20 }, (_, i) => ({ ...scope, content: `Extra ${i}`, source: "Support" })) });
    assert.equal((await listFeedback(db, scope, { limit: 100000 })).items.length, 50);
    assert.equal((await listFeedback(db, scope, { limit: -10 })).items.length, 1);
    await assert.rejects(listFeedback(db, { ...scope, organizationId: "" }), /scope is required/);
    await assert.rejects(listFeedback(db, { ...scope, projectId: "" }), /scope is required/);
    assert.deepEqual((await listFeedback(db, { ...scope, organizationId: "foreign" })).items, []);
    assert.equal(await getFeedback(db, { ...scope, projectId: "foreign" }, last.id), null);
  } finally {
    await db.organization.delete({ where: { id: org.id } });
    await db.$disconnect();
  }
});

import { createFeedbackInboxService, InboxQueryError } from "../src/server/services/feedback-inbox-service";
import { createOrganizationService } from "../src/server/services/organization-service";
import { createProjectService } from "../src/server/services/project-service";
import { inboxQuerySchema, inboxHref } from "../src/features/feedback/query";

test("inbox service search, filters, metadata and authorization", async t => {
  const db = getDb();
  const prefix = `inbox-service-${randomUUID()}`;
  const userIds: string[] = [], orgIds: string[] = [], projectIds: string[] = [];
  try {
    for (const suffix of ["a", "b"]) {
      const user = await db.user.create({ data: { externalAuthId: `${prefix}-${suffix}`, email: `${prefix}-${suffix}@example.com` } }); userIds.push(user.id);
      const org = await db.organization.create({ data: { name: prefix, slug: `${prefix}-${suffix}`, memberships: { create: { userId: user.id, role: "MEMBER" } } } }); orgIds.push(org.id);
      projectIds.push((await db.project.create({ data: { organizationId: org.id, name: "Main" } })).id);
    }
    const scope = { organizationId: orgIds[0], projectId: projectIds[0] };
    const foreignScope = { organizationId: orgIds[1], projectId: projectIds[1] };
    const createService = (userId: string) => createFeedbackInboxService({ requireProjectAccess: createProjectService({ requireMembership: createOrganizationService({ requireUser: async () => ({ id: userId }), database: () => db }).requireOrganizationMembership, database: () => db }).requireProjectAccess, database: () => db });
    const service = createService(userIds[0]);
    const foreignService = createService(userIds[1]);
    const batch = await db.feedbackImport.create({ data: { ...scope, createdById: userIds[0], fileName: "support.csv", status: "COMPLETED" } });
    const foreignBatch = await db.feedbackImport.create({ data: { ...foreignScope, createdById: userIds[1], fileName: "private.csv" } });
    const content = '<script>alert("hello")</script>\nLogin CRASH 100%_\\ original\n' + "Long customer feedback. ".repeat(100);
    const original = await db.feedback.create({ data: { ...scope, importId: batch.id, content, source: "Support", externalId: "TICKET-1042", customerReference: "Customer-88", occurredAt: new Date("2026-09-10T23:59:59.999Z") } });
    await db.feedback.create({ data: { ...scope, content: "Please add export", source: "Survey", occurredAt: new Date("2026-09-09T00:00:00Z") } });
    await db.feedback.create({ data: { ...scope, content: "Login with unknown date", source: "Support" } });
    const secret = await db.feedback.create({ data: { ...foreignScope, content: "Login CRASH private", source: "PrivateSource", importId: foreignBatch.id } });
    await t.test("case-insensitive literal substring searches cover content, external ID and customer", async () => {
      for (const q of [" crash ", "ticket-1042", "customer-88", "100%_\\"]) {
        const result = await service.list(scope, { q });
        assert.deepEqual(result.items.map(row => row.id), [original.id]);
        assert.equal(result.total, 1);
      }
      assert.equal((await service.list(scope, { q: "   " })).total, 3);
      assert.equal((await service.list(scope, { q: "does not exist" })).projectTotal, 3);
      assert.equal((await service.list(scope, { q: "does not exist" })).total, 0);
    });
    await t.test("source, inclusive UTC dates, import and all filters compose", async () => {
      assert.equal((await service.list(scope, { source: "Support" })).total, 2);
      assert.equal((await service.list(scope, { from: "2026-09-10", to: "2026-09-10" })).total, 1);
      assert.equal((await service.list(scope, { to: "2026-09-09" })).total, 1);
      const result = await service.list(scope, { q: "LOGIN", source: "Support", from: "2026-09-10", to: "2026-09-10", importId: batch.id });
      assert.deepEqual(result.items.map(row => row.id), [original.id]);
      assert.deepEqual(result.sources.map(row => row.source), ["Support", "Survey"]);
      assert.deepEqual(result.imports.map(row => row.id), [batch.id]);
    });
    await t.test("detail preserves full untrusted text and actual optional/import metadata", async () => {
      const detail = await service.detail(scope, original.id);
      assert.equal(detail?.content, content);
      assert.equal(detail?.import?.fileName, "support.csv");
      assert.equal(detail?.customerReference, "Customer-88");
      const nullable = (await service.list(scope, { q: "unknown date" })).items[0];
      const missing = await service.detail(scope, nullable.id);
      assert.equal(missing?.occurredAt, null);
      assert.equal(missing?.externalId, null);
      assert.equal(missing?.import, null);
    });
    await t.test("two-way tenant and sibling project IDs cannot leak detail or import metadata", async () => {
      assert.equal(await service.detail(scope, secret.id), null);
      assert.equal(await foreignService.detail(foreignScope, original.id), null);
      await assert.rejects(service.list(foreignScope), /unavailable/);
      await assert.rejects(foreignService.list(scope), /unavailable/);
      await assert.rejects(service.list(scope, { importId: foreignBatch.id }), InboxQueryError);
      const sibling = await db.project.create({ data: { organizationId: scope.organizationId, name: "Sibling" } });
      const siblingScope = { ...scope, projectId: sibling.id };
      assert.equal(await service.detail(siblingScope, original.id), null);
      await assert.rejects(service.list(siblingScope, { importId: batch.id }), InboxQueryError);
      const empty = await service.list(siblingScope);
      assert.equal(empty.projectTotal, 0);
      assert.equal(empty.total, 0);
      assert.deepEqual(empty.items, []);
    });
    await t.test("malformed, duplicate and oversized query values are rejected", async () => {
      for (const query of [{ q: ["a", "b"] }, { q: "a".repeat(501) }, { from: "2026-02-30" }, { from: "2026-09-11", to: "2026-09-01" }, { cursor: "bad" }, { cursor: "a".repeat(2001) }]) await assert.rejects(service.list(scope, query), InboxQueryError);
    });
    await t.test("URL pagination round-trips and resets for changed filters or project", async () => {
      await db.feedback.createMany({ data: Array.from({ length: 40 }, (_, i) => ({ ...scope, content: `Paged ${i}`, source: "Paged", createdAt: new Date("2026-09-12T00:00:00Z") })) });
      const first = await service.list(scope, { source: "Paged" });
      assert.equal(first.items.length, 25);
      assert.ok(first.nextCursor);
      const next = await service.list(scope, { source: "Paged", cursor: first.nextCursor });
      assert.equal(next.items.length, 15);
      const back = await service.list(scope, { source: "Paged", cursor: next.previousCursor });
      assert.deepEqual(back.items, first.items);
      const changed = await service.list(scope, { source: "Survey", cursor: first.nextCursor });
      assert.equal(changed.items.length, 1);
      assert.equal(changed.previousCursor, null);
      const other = await foreignService.list(foreignScope, { cursor: first.nextCursor });
      assert.equal(other.items[0].id, secret.id);
      assert.equal(other.previousCursor, null);
      const query = inboxQuerySchema.parse({ q: "login & crash", source: "Support" });
      assert.equal(inboxHref(query, ""), "/app/feedback?q=login+%26+crash&source=Support");
    });
    await t.test("revoked membership and unauthenticated requests fail before repository reads", async () => {
      await db.organizationMember.deleteMany({ where: { organizationId: scope.organizationId, userId: userIds[0] } });
      await assert.rejects(service.list(scope), /unavailable/);
      await assert.rejects(service.detail(scope, original.id), /unavailable/);
      const anonymous = createFeedbackInboxService({ requireProjectAccess: async () => { throw new Error("Unauthenticated"); }, database: () => { throw new Error("Database must not be reached"); } });
      await assert.rejects(anonymous.list(scope), /Unauthenticated/);
      await assert.rejects(anonymous.detail(scope, original.id), /Unauthenticated/);
    });
  } finally {
    await db.organization.deleteMany({ where: { id: { in: orgIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.$disconnect();
  }
});
