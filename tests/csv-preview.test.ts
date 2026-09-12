import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv, readCsvFile } from "../src/server/feedback-import/csv-parser";
import { CSV_MAX_BYTES, suggestColumnMappings, validateColumnMapping, validateCsvFile } from "../src/features/feedback-import/csv";
import { classifyDuplicates, parseOccurredAt, summarizePreview, transformCsvRows } from "../src/features/feedback-import/validation";

function preview(csv: string) {
  const parsed = parseCsv(csv);
  return summarizePreview("test.csv", classifyDuplicates(transformCsvRows(parsed, suggestColumnMappings(parsed.headers))));
}
test("CSV supports BOM, quoted commas, escaped quotes, multiline CRLF and physical row numbers", () => {
  const csv = parseCsv('\uFEFFid,message\r\n1,"Hello, ""world""\r\nnext line"\r\n\r\n2,Last\r\n');
  assert.deepEqual(csv.rows, [{ rowNumber: 2, values: ["1", 'Hello, "world"\r\nnext line'] }, { rowNumber: 5, values: ["2", "Last"] }]);
});
test("malformed CSV and headers fail with actionable errors", () => {
  for (const csv of ["", "\n", "id,message", ",message\n1,hi", "id,ID\n1,2", 'id,message\n1,"unclosed', 'id,message\n1,a"b', 'id,message\n1,"a"bad', "id,message\n1", "id,message\n1,2,3"]) assert.throws(() => parseCsv(csv));
  assert.equal(parseCsv("message\n\"\"\n").rows.length, 1);
  assert.equal(preview("id,message\n,\n").invalidRows, 1);
});
test("file bounds, type, encoding and capacity", async () => {
  assert.throws(() => validateCsvFile({ name: "a.xlsx", size: 10, type: "application/octet-stream" }));
  assert.throws(() => validateCsvFile({ name: "a.csv", size: 0, type: "" }));
  assert.throws(() => validateCsvFile({ name: "a.csv", size: CSV_MAX_BYTES + 1, type: "" }));
  validateCsvFile({ name: "A.CSV", size: CSV_MAX_BYTES, type: "" });
  assert.throws(() => parseCsv("message\n" + "a\n".repeat(5001)));
  assert.equal(parseCsv("message\n" + "a\n".repeat(5000)).rows.length, 5000);
  assert.throws(() => parseCsv(Array.from({ length: 101 }, (_, i) => `h${i}`).join(",") + "\n"));
  await assert.rejects(readCsvFile(new File([new Uint8Array([0xff, 0xfe])], "a.csv")), /UTF-8/);
  await assert.rejects(readCsvFile(new File(["a\0b"], "a.csv")), /encoding/);
  await assert.rejects(readCsvFile("file"));
});
test("mapping suggestions are deterministic, conservative, editable and reject forged keys", () => {
  const parsed = parseCsv("Ticket ID,message,created_at,email,channel\n1,hello,2026-09-01,a,b");
  const mapping = suggestColumnMappings(parsed.headers);
  assert.deepEqual(mapping, { content: "column_1", externalId: "column_0", occurredAt: "column_2", customerReference: "column_3", source: "column_4" });
  assert.throws(() => validateColumnMapping(parsed.headers, {}), /Feedback content/);
  assert.throws(() => validateColumnMapping(parsed.headers, { content: "__proto__" }));
  assert.throws(() => validateColumnMapping(parsed.headers, { content: "column_0", source: "column_0" }));
  assert.throws(() => validateColumnMapping(parsed.headers, { content: "column_0", surprise: true }));
  assert.equal(suggestColumnMappings(parseCsv("message,text\na,b").headers).content, undefined);
  assert.equal(transformCsvRows(parsed, { content: "column_0", externalId: "column_1" })[0].feedback.content, "1");
});
test("normalization preserves internal whitespace and safe literal text", () => {
  const result = preview('id,message,date,source\n1,"  <script>alert(1)</script>  \n  =1+1  ",,  ');
  assert.equal(result.rows[0].feedback.content, "<script>alert(1)</script>  \n  =1+1");
  assert.equal(result.rows[0].feedback.source, null);
  assert.equal(result.rows[0].feedback.occurredAt, null);
});
test("strict dates reject ambiguous, rolled-over and timezone-free input", () => {
  for (const value of ["tomorrow-ish", "09/01/2026", "2026-02-29", "2026-04-31", "2026-01-01T24:00:00Z", "2026-01-01T12:00:00", "2026-01-01T12:00:00+24:00"]) assert.equal(parseOccurredAt(value), null, value);
  assert.equal(parseOccurredAt("2024-02-29"), "2024-02-29T00:00:00.000Z");
  assert.equal(parseOccurredAt("2026-09-01T12:30:00.123+02:00"), "2026-09-01T10:30:00.123Z");
});
test("specified valid/missing/date/duplicate scenarios and invalid precedence", () => {
  assert.equal(preview("id,message,date\n1,Great product,2026-09-01\n2,App crashes,2026-09-02").validRows, 2);
  assert.equal(preview("id,message\n1,Great product\n2,").invalidRows, 1);
  assert.equal(preview("id,message,date\n1,Great product,not-a-date").invalidRows, 1);
  const result = preview("id,message\n100,\n100,First message\n100,Second message\n,Same text\n,Same text");
  assert.deepEqual([result.totalRows, result.validRows, result.invalidRows, result.duplicateRows], [5, 3, 1, 1]);
  assert.equal(result.rows[2].duplicateReason, "Matches row 3 in this CSV.");
  const rows = classifyDuplicates(result.rows, new Set(["100"]));
  assert.equal(rows[0].status, "INVALID");
  assert.equal(rows[1].duplicateReason, "Already exists in this project.");
});
