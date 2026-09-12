import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { getDb } from "../src/server/db/client";
import { createOrganizationService, OrganizationError } from "../src/server/services/organization-service";
import { createProjectService, ProjectError } from "../src/server/services/project-service";
import { createFeedbackImportPreviewService } from "../src/server/services/feedback-import-preview-service";
import { CsvError } from "../src/features/feedback-import/csv";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
test("preview enforces tenant/project boundaries, batched lookups, permissions, and no persistence", async t => {
  const db = getDb();
  const prefix = `csv-preview-${randomUUID()}`;
  const users: string[] = [], organizations: string[] = [], projects: string[] = [];
  try {
    for (const suffix of ["a", "b"]) {
      const user = await db.user.create({ data: { externalAuthId: `${prefix}-${suffix}`, email: `${prefix}-${suffix}@example.com` } }); users.push(user.id);
      const org = await db.organization.create({ data: { name: prefix, slug: `${prefix}-${suffix}`, memberships: { create: { userId: user.id, role: "OWNER" } } } }); organizations.push(org.id);
      const project = await db.project.create({ data: { organizationId: org.id, name: "Main" } }); projects.push(project.id);
    }
    const otherProject = await db.project.create({ data: { organizationId: organizations[0], name: "Other" } });
    await db.feedback.createMany({ data: [
      { organizationId: organizations[0], projectId: projects[0], source: "csv", content: "existing A", externalId: "100" },
      { organizationId: organizations[1], projectId: projects[1], source: "csv", content: "existing B", externalId: "101" },
      { organizationId: organizations[0], projectId: otherProject.id, source: "csv", content: "other project", externalId: "102" },
    ] });
    let lookups = 0;
    const measured = db.$extends({ query: { feedback: { async findMany({ args, query }) { lookups++; return query(args); } } } });
    function service(userId: string) {
      return createFeedbackImportPreviewService({
        requireProjectAccess: createProjectService({ requireMembership: createOrganizationService({ requireUser: async () => ({ id: userId }), database: () => db }).requireOrganizationMembership, database: () => db }).requireProjectAccess,
        database: () => ({ feedback: measured.feedback } as Pick<typeof db, "feedback">),
      });
    }
    const file = new File(["id,message,date\n100,Existing,2026-09-01\n101,Other tenant,2026-09-01\n102,Other project,2026-09-01\n102,Repeat,2026-09-01\n103,,bad-date"], "feedback.csv");
    const input = { organizationId: organizations[0], projectId: projects[0], file };
    const previewService = service(users[0]);
    await t.test("server reparses file, returns real counts and makes one batched scoped lookup", async () => {
      const detection = await previewService.detect(input);
      assert.equal(detection.totalRows, 5);
      const result = await previewService.preview({ ...input, mapping: detection.mapping });
      assert.deepEqual([result.validRows, result.invalidRows, result.duplicateRows], [2, 1, 2]);
      assert.deepEqual(result.rows.map(row => row.status), ["DUPLICATE", "VALID", "VALID", "DUPLICATE", "INVALID"]);
      assert.equal(lookups, 1);
      assert.equal(await db.feedback.count({ where: { organizationId: { in: organizations } } }), 3);
      assert.equal(await db.feedbackImport.count({ where: { organizationId: { in: organizations } } }), 0);
      await assert.rejects(previewService.preview({ ...input, mapping: { content: "forged" } }), CsvError);
    });
    await t.test("known foreign project and organization IDs are denied in both directions before parsing", async () => {
      for (const [own, other] of [[0, 1], [1, 0]]) {
        for (const operation of ["detect", "preview"] as const) {
          await assert.rejects(service(users[own])[operation]({ organizationId: organizations[own], projectId: projects[other], file: null, mapping: {} }), ProjectError);
          await assert.rejects(service(users[own])[operation]({ organizationId: organizations[other], projectId: projects[other], file: null, mapping: {} }), OrganizationError);
        }
      }
      assert.equal(lookups, 1);
    });
    await t.test("MEMBER cannot preview, ADMIN can, and revoked membership is rechecked", async () => {
      const membership = await db.organizationMember.create({ data: { organizationId: organizations[0], userId: users[1], role: "MEMBER" } });
      const memberService = service(users[1]);
      await assert.rejects(memberService.detect(input), /owners and admins/);
      await assert.rejects(memberService.preview({ ...input, mapping: { content: "column_1" } }), /owners and admins/);
      await db.organizationMember.update({ where: { id: membership.id }, data: { role: "ADMIN" } });
      const detection = await memberService.detect(input);
      await db.organizationMember.delete({ where: { id: membership.id } });
      await assert.rejects(memberService.preview({ ...input, mapping: detection.mapping }), OrganizationError);
    });
    await t.test("no external IDs means no duplicate query", async () => {
      const before = lookups;
      const result = await previewService.preview({ ...input, mapping: { content: "column_1" } });
      assert.equal(result.duplicateRows, 0);
      assert.equal(lookups, before);
    });
  } finally {
    await db.organization.deleteMany({ where: { id: { in: organizations } } });
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
});
