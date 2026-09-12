import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { getDb } from "../src/server/db/client";
import { createOrganizationService } from "../src/server/services/organization-service";
import { createProjectService } from "../src/server/services/project-service";
import { createFeedbackImportService } from "../src/server/services/feedback-import-service";
import { createFeedbackImportPreviewService } from "../src/server/services/feedback-import-preview-service";
import { hasCompletedFirstImport, createImportAttempt, persistImportBatch, type ImportDatabase } from "../src/server/repositories/import-repository";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
test("CSV execution, concurrency, atomic failure, history and tenant isolation", async t => {
  const db = getDb();
  const prefix = `execution-${randomUUID()}`;
  const users: string[] = [], organizations: string[] = [], projects: string[] = [];
  try {
    for (const suffix of ["a", "b"]) {
      const user = await db.user.create({ data: { externalAuthId: `${prefix}-${suffix}`, email: `${prefix}-${suffix}@example.com` } }); users.push(user.id);
      const org = await db.organization.create({ data: { name: prefix, slug: `${prefix}-${suffix}`, memberships: { create: { userId: user.id, role: "OWNER" } } } }); organizations.push(org.id);
      projects.push((await db.project.create({ data: { organizationId: org.id, name: "Main" } })).id);
    }
    const scope = { organizationId: organizations[0], projectId: projects[0] };
    const access = (userId: string) => createProjectService({ requireMembership: createOrganizationService({ requireUser: async () => ({ id: userId }), database: () => db }).requireOrganizationMembership, database: () => db }).requireProjectAccess;
    const service = createFeedbackImportService({ requireProjectAccess: access(users[0]), database: () => db });
    const previewService = createFeedbackImportPreviewService({ requireProjectAccess: access(users[0]), database: () => db });
    const file = new File(['id,feedback,date\n1,First,2026-09-01\n1,Duplicate,2026-09-01\n2,,bad\n,No ID,\n3,Later duplicate,'], 'execution.csv');
    const detected = await previewService.detect({ ...scope, file });
    const input = { ...scope, file, mapping: detected.mapping, executionId: randomUUID() };
    let importId = "";
    await t.test("rechecks post-preview duplicates, persists trusted fields and committed counters", async () => {
      const preview = await previewService.preview(input);
      assert.equal(preview.validRows, 3);
      assert.equal(await hasCompletedFirstImport(db, scope), false);
      await db.feedback.create({ data: { ...scope, source: 'support', content: 'arrived later', externalId: '3' } });
      const result = await service.execute({ ...input, ...{ importedRows: 999, validRows: 999 } });
      importId = result.id;
      assert.deepEqual([result.status, result.totalRows, result.importedRows, result.invalidRows, result.totalRows-result.invalidRows-result.validRows], ['COMPLETED', 5, 2, 1, 2]);
      const rows = await db.feedback.findMany({ where: { ...scope, importId } });
      assert.equal(rows.length, 2);
      assert.ok(rows.every(row => row.organizationId === scope.organizationId && row.projectId === scope.projectId && row.source === 'csv' && row.processingStatus === 'PENDING'));
      assert.equal(rows.find(row => row.externalId === '1')?.occurredAt?.toISOString(), '2026-09-01T00:00:00.000Z');
      assert.equal(await hasCompletedFirstImport(db, scope), true);
    });
    await t.test("replays and simultaneous confirmations create one batch even without external IDs", async () => {
      assert.equal((await service.execute(input)).id, importId);
      assert.equal(await db.feedback.count({ where: { ...scope, importId } }), 2);
      const same = { ...scope, file: new File(['feedback\nNo identifier'], 'same.csv'), mapping: { content: 'column_0' }, executionId: randomUUID() };
      await Promise.all([service.execute(same), service.execute(same)]);
      assert.equal(await db.feedback.count({ where: { ...scope, importId: same.executionId } }), 1);
      assert.equal((await service.detail({ ...scope, importId: same.executionId }))?.status, 'COMPLETED');
    });
    await t.test("uniqueness races skip only duplicates and counters match insertion", async () => {
      const race = { ...scope, file: new File(['id,feedback\nrace,Concurrent'], 'race.csv'), mapping: { externalId: 'column_0', content: 'column_1' } };
      const results = await Promise.all([service.execute({ ...race, executionId: randomUUID() }), service.execute({ ...race, executionId: randomUUID() })]);
      assert.equal(results.reduce((sum, row) => sum + row.importedRows, 0), 1);
      assert.ok(results.every(row => row.status === 'COMPLETED' && row.totalRows === row.importedRows + row.invalidRows + (row.totalRows-row.invalidRows-row.validRows)));
    });
    await t.test("failed finalization rolls back inserted rows and persists safe failed history", async () => {
      const preview = await previewService.preview({ ...scope, file: new File(['feedback\nMust roll back'], 'failure.csv'), mapping: { content: 'column_0' } });
      const id = randomUUID();
      await createImportAttempt(db, { ...scope, id, createdById: users[0], preview });
      const failing: ImportDatabase = { feedback: db.feedback, feedbackImport: db.feedbackImport, $transaction: (async (callback: (tx: unknown) => Promise<unknown>) => db.$transaction(async tx => callback({ feedback: tx.feedback, feedbackImport: { update: async () => { throw new Error('private database detail'); } } }))) as ImportDatabase['$transaction'] };
      await persistImportBatch(failing, { ...scope, importId: id, preview });
      const result = await service.detail({ ...scope, importId: id });
      assert.equal(result?.status, 'FAILED');
      assert.equal(result?.importedRows, 0);
      assert.equal(await db.feedback.count({ where: { ...scope, importId: id } }), 0);
      assert.ok(!result?.errorMessage?.includes('private'));
    });
    await t.test("history is scoped, bounded, newest first and includes completed/failed attempts", async () => {
      const history = await service.list(scope);
      assert.ok(history.some(row => row.status === 'FAILED'));
      assert.ok(history.some(row => row.status === 'COMPLETED'));
      assert.ok(history.every((row, index) => !index || history[index-1].createdAt >= row.createdAt));
      const other = await db.project.create({ data: { organizationId: scope.organizationId, name: 'Other' } });
      assert.equal(await service.detail({ ...scope, projectId: other.id, importId }), null);
      assert.deepEqual(await service.list({ ...scope, projectId: other.id }), []);
      const foreign = createFeedbackImportService({ requireProjectAccess: access(users[1]), database: () => db });
      assert.equal(await foreign.detail({ organizationId: organizations[1], projectId: projects[1], importId }), null);
      await assert.rejects(foreign.execute(input), /unavailable/);
      await assert.rejects(service.execute({ ...input, projectId: projects[1] }), /unavailable/);
      assert.equal(await db.feedbackImport.count({ where: { organizationId: organizations[1] } }), 0);
    });
    await t.test("zero eligible rows persist an honest zero result without completing onboarding", async () => {
      const emptyProject = await db.project.create({ data: { organizationId: scope.organizationId, name: 'Zero rows' } });
      const emptyScope = { ...scope, projectId: emptyProject.id };
      const result = await service.execute({ ...emptyScope, file: new File(['feedback,date\n,invalid'], 'invalid.csv'), mapping: { content: 'column_0', occurredAt: 'column_1' }, executionId: randomUUID() });
      assert.deepEqual([result.status, result.importedRows, result.invalidRows], ['COMPLETED', 0, 1]);
      assert.equal(await hasCompletedFirstImport(db, emptyScope), false);
      assert.equal(await db.feedback.count({ where: emptyScope }), 0);
    });
    await t.test("database uniqueness catches a duplicate inserted after the final recheck", async () => {
      const preview = await previewService.preview({ ...scope, file: new File(['id,feedback\nlate-race,Must skip'], 'late.csv'), mapping: { externalId: 'column_0', content: 'column_1' } });
      assert.equal(preview.validRows, 1);
      const id = randomUUID();
      await createImportAttempt(db, { ...scope, id, createdById: users[0], preview });
      await db.feedback.create({ data: { ...scope, source: 'csv', externalId: 'late-race', content: 'won race' } });
      await persistImportBatch(db, { ...scope, importId: id, preview });
      const result = await service.detail({ ...scope, importId: id });
      assert.equal(result?.status, 'COMPLETED');
      assert.equal(result?.importedRows, 0);
      assert.equal(result?.validRows, 0);
    });
    await t.test("invalid mapping, unauthenticated, revoked and MEMBER requests do not execute", async () => {
      await assert.rejects(service.execute({ ...input, executionId: randomUUID(), mapping: { content: 'forged' } }), /column/);
      const signedOut = createFeedbackImportService({ requireProjectAccess: async () => { throw new Error('Unauthenticated'); }, database: () => db });
      await assert.rejects(signedOut.execute(input), /Unauthenticated/);
      await db.organizationMember.updateMany({ where: { organizationId: scope.organizationId }, data: { role: 'MEMBER' } });
      await assert.rejects(service.execute(input), /owners and admins/);
      await db.organizationMember.deleteMany({ where: { organizationId: scope.organizationId } });
      await assert.rejects(service.execute(input), /unavailable/);
    });
  } finally {
    await db.organization.deleteMany({ where: { id: { in: organizations } } });
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
});
