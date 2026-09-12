import { type ColumnMapping, type CsvImportPreview, type CsvPreviewRow, type ParsedCsv, validateColumnMapping } from "./csv";

export function parseOccurredAt(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2}))?$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second, , zone] = match;
  const calendar = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== `${year}-${month}-${day}`) return null;
  if (hour && (+hour > 23 || +minute > 59 || +second > 59)) return null;
  if (zone && zone !== "Z" && (+zone.slice(1, 3) > 23 || +zone.slice(4) > 59)) return null;
  const timestamp = new Date(hour ? value : `${value}T00:00:00Z`);
  return Number.isFinite(timestamp.getTime()) ? timestamp.toISOString() : null;
}

export function transformCsvRows(parsed: ParsedCsv, input: unknown): CsvPreviewRow[] {
  const mapping: ColumnMapping = validateColumnMapping(parsed.headers, input);
  const positions = new Map(parsed.headers.map((header, index) => [header.key, index]));
  return parsed.rows.map(row => {
    function value(field: keyof ColumnMapping) {
      const key = mapping[field];
      const index = key === undefined ? undefined : positions.get(key);
      return index === undefined ? null : row.values[index].trim() || null;
    }
    const content = value("content") ?? "";
    const originalDate = value("occurredAt");
    const occurredAt = originalDate ? parseOccurredAt(originalDate) : null;
    const errors: string[] = [];
    if (!content) errors.push("Feedback content is required.");
    if (originalDate && !occurredAt) errors.push("Occurred at is not a valid date. Use YYYY-MM-DD or an ISO timestamp with timezone.");
    return { rowNumber: row.rowNumber, status: errors.length ? "INVALID" : "VALID", errors, originalDate,
      feedback: { rowNumber: row.rowNumber, content, occurredAt, source: value("source"), externalId: value("externalId"), customerReference: value("customerReference") } };
  });
}

export function classifyDuplicates(rows: CsvPreviewRow[], existing: ReadonlySet<string> = new Set()): CsvPreviewRow[] {
  const firstRows = new Map<string, number>();
  return rows.map(row => {
    const id = row.feedback.externalId;
    if (row.status === "INVALID" || !id) return row;
    const first = firstRows.get(id);
    if (first === undefined) firstRows.set(id, row.rowNumber);
    const duplicateReason = existing.has(id) ? "Already exists in this project." : first !== undefined ? `Matches row ${first} in this CSV.` : undefined;
    return duplicateReason ? { ...row, status: "DUPLICATE", duplicateReason } : row;
  });
}
export function summarizePreview(fileName: string, rows: CsvPreviewRow[]): CsvImportPreview {
  return { fileName, rows, totalRows: rows.length, validRows: rows.filter(row => row.status === "VALID").length,
    invalidRows: rows.filter(row => row.status === "INVALID").length, duplicateRows: rows.filter(row => row.status === "DUPLICATE").length };
}
