import { CSV_MAX_COLUMNS, CSV_MAX_ROWS, CsvError, normalizeCsvHeader, validateCsvFile, type ParsedCsv } from "@/features/feedback-import/csv";

export async function readCsvFile(input: unknown): Promise<{ fileName: string; parsed: ParsedCsv }> {
  if (!(input instanceof File)) throw new CsvError("Choose a CSV file.");
  validateCsvFile(input);
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(await input.arrayBuffer()); }
  catch { throw new CsvError("We couldn't read the file encoding. Save your CSV as UTF-8 and try again."); }
  return { fileName: input.name, parsed: parseCsv(text) };
}

export function parseCsv(input: string): ParsedCsv {
  const text = input.replace(/^\uFEFF/, "");
  if (text.includes("\0")) throw new CsvError("Unsupported file encoding. Save your CSV as UTF-8.");
  const records: ParsedCsv["rows"] = [];
  let values: string[] = [], cell = "", quoted = false, closed = false, touched = false, line = 1, start = 1;
  function endCell() {
    values.push(cell); cell = ""; closed = false;
    if (values.length > CSV_MAX_COLUMNS) throw new CsvError("Preview currently supports up to 100 columns.");
  }
  function endRow() {
    if (touched) { endCell(); records.push({ rowNumber: start, values }); }
    if (records.length > CSV_MAX_ROWS + 1) throw new CsvError("Preview currently supports up to 5,000 feedback rows. Split your CSV.");
    values = []; cell = ""; touched = false; closed = false;
  }
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else { quoted = false; closed = true; }
      } else {
        cell += char;
        if (char === "\r") { if (text[i + 1] === "\n") cell += text[++i]; line++; }
        else if (char === "\n") line++;
      }
      continue;
    }
    if (char === "\r" || char === "\n") {
      endRow();
      if (char === "\r" && text[i + 1] === "\n") i++;
      line++; start = line; continue;
    }
    touched = true;
    if (char === ",") { endCell(); continue; }
    if (closed) throw new CsvError(`Malformed quotes at line ${line}. Check the CSV formatting.`);
    if (char === '"') {
      if (cell.length) throw new CsvError(`Unexpected quote at line ${line}. Quote the entire cell and escape internal quotes.`);
      quoted = true;
    } else cell += char;
  }
  if (quoted) throw new CsvError(`Unclosed quoted cell starting in row ${start}.`);
  endRow();
  const header = records.shift();
  if (!header) throw new CsvError("We couldn't find a header row in this CSV.");
  const labels = header.values.map(value => value.trim());
  if (labels.some(label => !label)) throw new CsvError("Every column needs a non-empty header.");
  if (new Set(labels.map(normalizeCsvHeader)).size !== labels.length) throw new CsvError("CSV headers must be unique. Rename duplicate columns.");
  if (!records.length) throw new CsvError("This CSV doesn't contain any feedback rows.");
  for (const record of records) if (record.values.length !== labels.length) throw new CsvError(`Row ${record.rowNumber} has ${record.values.length} columns; expected ${labels.length}. Check commas and quotes.`);
  return { headers: labels.map((label, index) => ({ key: `column_${index}`, label })), rows: records };
}
