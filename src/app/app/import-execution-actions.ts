"use server";

import { unstable_rethrow } from "next/navigation";
import { CsvError, type CsvResult } from "@/features/feedback-import/csv";
import { requireProjectAccess } from "@/server/auth/project-context";
import { getDb } from "@/server/db/client";
import { createFeedbackImportService } from "@/server/services/feedback-import-service";
import { ProjectError } from "@/server/services/project-service";
import { OrganizationError } from "@/server/services/organization-service";

export async function executeCsvAction(form: FormData): Promise<CsvResult<{ importId: string }>> {
  try {
    let mapping: unknown;
    try { mapping = JSON.parse(String(form.get("mapping"))); }
    catch { throw new CsvError("Column mapping is invalid. Preview your CSV again."); }
    const service = createFeedbackImportService({ requireProjectAccess, database: getDb });
    const result = await service.execute({ organizationId: form.get("organizationId"), projectId: form.get("projectId"), file: form.get("file"), mapping, executionId: form.get("executionId") });
    return { data: { importId: result.id } };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof CsvError || error instanceof ProjectError || error instanceof OrganizationError) return { error: error.message };
    console.error({ operation: "csv_import_execution", status: "failed" });
    return { error: "We couldn't confirm the import outcome. Retry this confirmation or check import history." };
  }
}
