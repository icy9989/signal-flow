import "server-only";
import { z } from "zod";
import { CsvError } from "@/features/feedback-import/csv";
import { readCsvFile } from "@/server/feedback-import/csv-parser";
import { transformCsvRows, classifyDuplicates, summarizePreview } from "@/features/feedback-import/validation";
import { findExistingFeedbackExternalIds } from "@/server/repositories/feedback-repository";
import { createImportAttempt, getFeedbackImport, listFeedbackImports, persistImportBatch, type ImportDatabase } from "@/server/repositories/import-repository";
import type { createProjectService } from "./project-service";

type ScopeInput = { organizationId: unknown; projectId: unknown };
type Dependencies = {
  requireProjectAccess: ReturnType<typeof createProjectService>["requireProjectAccess"];
  database: () => ImportDatabase;
};
export function createFeedbackImportService({ requireProjectAccess, database }: Dependencies) {
  return {
    async execute(input: ScopeInput & { file: unknown; mapping: unknown; executionId: unknown }) {
      const context = await requireProjectAccess(input);
      if (context.membership.role !== "OWNER" && context.membership.role !== "ADMIN") throw new CsvError("Only workspace owners and admins can import feedback.");
      const id = z.uuid().safeParse(input.executionId);
      if (!id.success) throw new CsvError("Import is not ready. Preview your CSV again.");
      const scope = { organizationId: context.organization.id, projectId: context.project.id };
      const db = database();
      const previous = await getFeedbackImport(db, { ...scope, importId: id.data });
      if (previous) return previous;
      const { fileName, parsed } = await readCsvFile(input.file);
      const rows = transformCsvRows(parsed, input.mapping);
      const externalIds = rows.flatMap(row => row.status === "VALID" && row.feedback.externalId ? [row.feedback.externalId] : []);
      const existing = await findExistingFeedbackExternalIds(db, { ...scope, externalIds: [...new Set(externalIds)] });
      const preview = summarizePreview(fileName, classifyDuplicates(rows, existing));
      const created = await createImportAttempt(db, { ...scope, id: id.data, createdById: context.user.id, preview });
      if (created) await persistImportBatch(db, { ...scope, importId: id.data, preview });
      const result = await getFeedbackImport(db, { ...scope, importId: id.data });
      if (!result) throw new CsvError("Import unavailable. Preview your CSV again.");
      return result;
    },
    async list(input: ScopeInput) {
      const { organization, project } = await requireProjectAccess(input);
      return listFeedbackImports(database(), { organizationId: organization.id, projectId: project.id });
    },
    async detail(input: ScopeInput & { importId: string }) {
      const { organization, project } = await requireProjectAccess(input);
      return getFeedbackImport(database(), { organizationId: organization.id, projectId: project.id, importId: input.importId });
    },
  };
}
