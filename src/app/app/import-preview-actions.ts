"use server";

import { randomUUID } from "node:crypto";
import { unstable_rethrow } from "next/navigation";
import { CsvError, type CsvDetection, type CsvImportPreview, type CsvResult } from "@/features/feedback-import/csv";
import { requireProjectAccess } from "@/server/auth/project-context";
import { getDb } from "@/server/db/client";
import { createFeedbackImportPreviewService } from "@/server/services/feedback-import-preview-service";
import { ProjectError } from "@/server/services/project-service";
import { OrganizationError } from "@/server/services/organization-service";

const service = createFeedbackImportPreviewService({ requireProjectAccess, database: getDb });
function failure(error: unknown, stage: string): { error: string } {
  unstable_rethrow(error);
  const expected = error instanceof CsvError || error instanceof ProjectError || error instanceof OrganizationError;
  console.error({ operation: "csv_preview", stage, status: "failed", errorType: expected ? error.name : "InternalError" });
  return { error: expected ? error.message : "We couldn't preview this CSV. Please try again." };
}
export async function detectCsvAction(form: FormData): Promise<CsvResult<CsvDetection>> {
  try { return { data: await service.detect({ organizationId: form.get("organizationId"), projectId: form.get("projectId"), file: form.get("file") }) }; }
  catch (error) { return failure(error, "parsing"); }
}
export async function previewCsvAction(form: FormData): Promise<CsvResult<CsvImportPreview & { executionId: string }>> {
  try {
    let mapping: unknown;
    try { mapping = JSON.parse(String(form.get("mapping"))); }
    catch { throw new CsvError("Column mapping is invalid. Select columns from this CSV."); }
    return { data: { ...await service.preview({ organizationId: form.get("organizationId"), projectId: form.get("projectId"), file: form.get("file"), mapping }), executionId: randomUUID() } };
  } catch (error) { return failure(error, "validation"); }
}
