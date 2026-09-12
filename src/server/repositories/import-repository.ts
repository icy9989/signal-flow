import "server-only";

import type { CsvImportPreview } from "@/features/feedback-import/csv";
import type { PrismaClient } from "@/generated/prisma/client";

export async function hasCompletedFirstImport(
  database: Pick<PrismaClient, "feedbackImport">,
  { organizationId, projectId }: { organizationId: string; projectId: string },
): Promise<boolean> {
  const completedImport = await database.feedbackImport.findFirst({
    where: {
      organizationId,
      projectId,
      status: "COMPLETED",
      feedback: { some: { organizationId, projectId } },
    },
    select: { id: true },
  });
  return completedImport !== null;
}

export type ImportDatabase = Pick<PrismaClient, "feedbackImport" | "feedback" | "$transaction">;
type ImportScope = { organizationId: string; projectId: string };

const importSelect = {
  id: true, fileName: true, status: true, totalRows: true, validRows: true,
  invalidRows: true, importedRows: true, errorMessage: true, createdAt: true, updatedAt: true,
} as const;

export function getFeedbackImport(database: Pick<PrismaClient, "feedbackImport">, { importId, ...scope }: ImportScope & { importId: string }) {
  return database.feedbackImport.findFirst({ where: { ...scope, id: importId }, select: importSelect });
}

export function listFeedbackImports(database: Pick<PrismaClient, "feedbackImport">, scope: ImportScope) {
  return database.feedbackImport.findMany({ where: scope, select: importSelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 50 });
}

export async function createImportAttempt(database: ImportDatabase, { preview, ...input }: ImportScope & { id: string; createdById: string; preview: CsvImportPreview }) {
  // A primary-key conflict is an already claimed execution, never permission to rerun it.
  const result = await database.feedbackImport.createMany({ data: [{ ...input, fileName: preview.fileName, totalRows: preview.totalRows, validRows: preview.validRows, invalidRows: preview.invalidRows }], skipDuplicates: true });
  return result.count === 1;
}

export async function persistImportBatch(database: ImportDatabase, { preview, importId, ...scope }: ImportScope & { importId: string; preview: CsvImportPreview }) {
  const where = { ...scope, id: importId };
  const claim = await database.feedbackImport.updateMany({ where: { ...where, status: "PENDING" }, data: { status: "PROCESSING" } });
  if (!claim.count) return;
  try {
    await database.$transaction(async tx => {
      const candidates = preview.rows.filter(row => row.status === "VALID").map(({ feedback }) => feedback);
      // skipDuplicates uses the database constraint to resolve IDs arriving after the recheck.
      const inserted = candidates.length ? await tx.feedback.createMany({
        data: candidates.map(row => ({ ...scope, importId, content: row.content, source: row.source ?? "csv", externalId: row.externalId, customerReference: row.customerReference, occurredAt: row.occurredAt ? new Date(row.occurredAt) : null, processingStatus: "PENDING" })),
        skipDuplicates: true,
      }) : { count: 0 };
      await tx.feedbackImport.update({ where: { ...where, status: "PROCESSING" }, data: { status: "COMPLETED", importedRows: inserted.count, validRows: inserted.count, errorMessage: null } });
    }, { timeout: 30000 });
  } catch {
    console.error({ operation: "csv_import_persistence", ...scope, importId, status: "failed" });
    // A conditional update also protects a completed commit if its acknowledgement was lost.
    await database.feedbackImport.updateMany({ where: { ...where, status: "PROCESSING" }, data: { status: "FAILED", importedRows: 0, errorMessage: "We couldn't save this feedback batch. No feedback from this attempt was added." } });
  }
}
