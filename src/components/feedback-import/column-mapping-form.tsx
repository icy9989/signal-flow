import { Button } from "@/components/ui/button";
import { importFields, type ColumnMapping, type CsvHeader, validateColumnMapping } from "@/features/feedback-import/csv";

const labels = { content: "Feedback content", source: "Source", externalId: "External ID", customerReference: "Customer reference", occurredAt: "Occurred at" };
export function ColumnMappingForm({ headers, mapping, onChange, onPreview }: { headers: CsvHeader[]; mapping: ColumnMapping; onChange: (mapping: ColumnMapping) => void; onPreview: () => void }) {
  let issue = "";
  try { validateColumnMapping(headers, mapping); } catch (error) { issue = error instanceof Error ? error.message : "Check your mapping."; }
  return <form onSubmit={event => { event.preventDefault(); if (!issue) onPreview(); }} className="space-y-5">
    <p className="text-sm text-secondary">Map each field to a CSV column. Suggestions can be changed.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      {importFields.map(field => <div key={field} className="min-w-0 space-y-2">
        <label className="block text-sm font-medium" htmlFor={`mapping-${field}`}>{labels[field]}{field === "content" ? " *" : ""}</label>
        <select id={`mapping-${field}`} value={mapping[field] ?? ""} required={field === "content"} aria-describedby={issue ? "mapping-error" : field === "occurredAt" ? "date-help" : undefined}
          className="h-11 w-full min-w-0 rounded-md border border-border bg-elevated px-3 text-sm"
          onChange={event => { const next = { ...mapping }; if (event.target.value) next[field] = event.target.value; else delete next[field]; onChange(next); }}>
          <option value="">{field === "content" ? "Select column" : "Not mapped"}</option>
          {headers.map(header => <option key={header.key} value={header.key}>{header.label}</option>)}
        </select>
      </div>)}
    </div>
    <p id="date-help" className="text-xs leading-5 text-secondary">Dates: YYYY-MM-DD or ISO timestamps with timezone, such as 2026-09-01T12:30:00Z. Blank optional fields stay empty.</p>
    {issue && <p id="mapping-error" role="status" className="text-sm text-warning">{issue}</p>}
    <Button type="submit" disabled={!!issue}>Preview import</Button>
  </form>;
}
