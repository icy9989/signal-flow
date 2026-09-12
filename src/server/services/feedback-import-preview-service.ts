import "server-only";
import { CsvError, suggestColumnMappings, type CsvDetection } from "@/features/feedback-import/csv";
import { classifyDuplicates, summarizePreview, transformCsvRows } from "@/features/feedback-import/validation";
import { readCsvFile } from "@/server/feedback-import/csv-parser";
import { findExistingFeedbackExternalIds, type FeedbackLookupDatabase } from "@/server/repositories/feedback-repository";
import type { createProjectService } from "@/server/services/project-service";

type Dependencies = {
  requireProjectAccess: ReturnType<typeof createProjectService>["requireProjectAccess"];
  database: () => FeedbackLookupDatabase;
};
type PreviewInput = { organizationId: unknown; projectId: unknown; file: unknown };
export function createFeedbackImportPreviewService({ requireProjectAccess, database }: Dependencies) {
  async function authorize(input: PreviewInput) {
    const context = await requireProjectAccess(input);
    if (context.membership.role !== "OWNER" && context.membership.role !== "ADMIN") throw new CsvError("Only workspace owners and admins can import feedback.");
    return context;
  }
  return {
    async detect(input: PreviewInput): Promise<CsvDetection> {
      await authorize(input);
      const { fileName, parsed } = await readCsvFile(input.file);
      return { fileName, headers: parsed.headers, totalRows: parsed.rows.length, mapping: suggestColumnMappings(parsed.headers) };
    },
    async preview(input: PreviewInput & { mapping: unknown }) {
      const context = await authorize(input);
      const { fileName, parsed } = await readCsvFile(input.file);
      const rows = transformCsvRows(parsed, input.mapping);
      const externalIds = [...new Set(rows.flatMap(row => row.status === "VALID" && row.feedback.externalId ? [row.feedback.externalId] : []))];
      const existing = await findExistingFeedbackExternalIds(database(), { organizationId: context.organization.id, projectId: context.project.id, externalIds });
      return summarizePreview(fileName, classifyDuplicates(rows, existing));
    },
  };
}
