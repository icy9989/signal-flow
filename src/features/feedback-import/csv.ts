import { z } from "zod";

export const CSV_MAX_BYTES = 512 * 1024;
export const CSV_MAX_ROWS = 5000;
export const CSV_MAX_COLUMNS = 100;
export const importFields = ["content", "source", "externalId", "customerReference", "occurredAt"] as const;
export type ImportField = typeof importFields[number];
export type ColumnMapping = Partial<Record<ImportField, string>>;
export type CsvHeader = { key: string; label: string };
export type ParsedCsv = { headers: CsvHeader[]; rows: { rowNumber: number; values: string[] }[] };
export type CsvDetection = { fileName: string; headers: CsvHeader[]; totalRows: number; mapping: ColumnMapping };
export type CandidateFeedback = { rowNumber: number; content: string; source: string | null; externalId: string | null; customerReference: string | null; occurredAt: string | null };
export type CsvPreviewRow = { rowNumber: number; status: "VALID" | "INVALID" | "DUPLICATE"; feedback: CandidateFeedback; errors: string[]; originalDate: string | null; duplicateReason?: string };
export type CsvImportPreview = { fileName: string; totalRows: number; validRows: number; invalidRows: number; duplicateRows: number; rows: CsvPreviewRow[] };
export type CsvResult<T> = { data: T; error?: never } | { error: string; data?: never };
export class CsvError extends Error {
  constructor(message: string) { super(message); this.name = "CsvError"; }
}

export function validateCsvFile(file: { name: string; size: number; type: string }) {
  const csvMime = ["text/csv", "application/csv", "text/x-csv", "application/vnd.ms-excel"];
  if (!/\.csv$/i.test(file.name) && !csvMime.includes(file.type)) throw new CsvError("Choose a CSV file. Other spreadsheet formats are not supported.");
  if (!file.size) throw new CsvError("This CSV is empty. Choose a file with headers and feedback rows.");
  if (file.size > CSV_MAX_BYTES) throw new CsvError("Preview currently supports files up to 512 KiB. Split your CSV into smaller files.");
}

export function normalizeCsvHeader(header: string) { return header.trim().toLowerCase().replace(/[\s_-]+/g, ""); }
const aliases: Record<ImportField, string[]> = {
  content: ["content", "message", "feedback", "comment", "review", "text", "description"],
  source: ["source", "channel"], externalId: ["id", "ticketid", "feedbackid", "externalid"],
  customerReference: ["customer", "customerreference", "customerid", "email", "userid"],
  occurredAt: ["date", "createdat", "timestamp", "submittedat", "occurredat"],
};
export function suggestColumnMappings(headers: CsvHeader[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const field of importFields) {
    const matches = headers.filter(({ label }) => aliases[field].includes(normalizeCsvHeader(label)));
    if (matches.length === 1) mapping[field] = matches[0].key;
  }
  return mapping;
}
const mappingSchema = z.strictObject({ content: z.string().optional(), source: z.string().optional(), externalId: z.string().optional(), customerReference: z.string().optional(), occurredAt: z.string().optional() });
export function validateColumnMapping(headers: CsvHeader[], input: unknown): ColumnMapping {
  const result = mappingSchema.safeParse(input);
  if (!result.success) throw new CsvError("Column mapping is invalid. Select columns from this CSV.");
  const mapping = result.data;
  if (!mapping.content) throw new CsvError("Map a column to Feedback content before continuing.");
  const used = new Set<string>();
  for (const key of Object.values(mapping)) {
    if (!headers.some(header => header.key === key)) throw new CsvError("A mapped column is not present in this CSV.");
    if (used.has(key)) throw new CsvError("Each CSV column can map to only one field.");
    used.add(key);
  }
  return mapping;
}
