"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CsvImportPreview, CsvPreviewRow } from "@/features/feedback-import/csv";

const labels = { VALID: "Ready", INVALID: "Invalid", DUPLICATE: "Duplicate" };
const colors = { VALID: "text-primary bg-primary-soft", INVALID: "text-destructive bg-destructive/10", DUPLICATE: "text-warning bg-warning/10" };
export function ImportPreviewTable({ preview }: { preview: CsvImportPreview }) {
  const [filter, setFilter] = useState<"ALL" | CsvPreviewRow["status"]>("ALL");
  const [page, setPage] = useState(0);
  const rows = preview.rows.filter(row => filter === "ALL" || row.status === filter);
  const pages = Math.max(1, Math.ceil(rows.length / 25));
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2" aria-label="Filter preview rows">
      {(["ALL", "VALID", "INVALID", "DUPLICATE"] as const).map(status => <Button key={status} variant="outline" aria-pressed={filter === status} className={filter === status ? "border-primary text-primary" : ""} onClick={() => { setFilter(status); setPage(0); }}>{status === "ALL" ? "All" : status === "DUPLICATE" ? "Duplicates" : labels[status]}</Button>)}
    </div>
    <div className="overflow-x-auto rounded-lg border border-border" tabIndex={0} role="region" aria-label="CSV preview table">
      <table className="w-full min-w-[960px] table-fixed text-left text-sm">
        <caption className="sr-only">Mapped customer feedback with source row numbers and validation issues</caption>
        <thead className="bg-elevated text-xs text-secondary"><tr>{["Status", "Row", "Feedback", "Source", "External ID", "Customer", "Occurred at", "Issue"].map((label, index) => <th scope="col" key={label} className={`px-3 py-3 font-medium ${index === 2 || index === 7 ? "w-64" : index === 1 ? "w-16" : "w-32"}`}>{label}</th>)}</tr></thead>
        <tbody>{rows.slice(page * 25, (page + 1) * 25).map(row => <tr key={row.rowNumber} className="border-t border-border align-top hover:bg-hover">
          <td className="p-3"><span className={`inline-block rounded-full px-2 py-1 text-xs ${colors[row.status]}`}>{labels[row.status]}</span></td>
          <th scope="row" className="p-3 font-mono font-normal">{row.rowNumber}</th>
          <td className="p-3"><details><summary className="cursor-pointer break-words">{row.feedback.content.length > 110 ? `${row.feedback.content.slice(0, 110)}…` : row.feedback.content || "No content"}</summary><p className="mt-2 whitespace-pre-wrap break-words">{row.feedback.content || "—"}</p></details></td>
          <td className="break-words p-3">{row.feedback.source ?? "—"}</td>
          <td className="break-words p-3">{row.feedback.externalId ?? "—"}</td>
          <td className="break-words p-3">{row.feedback.customerReference ?? "—"}</td>
          <td className="break-words p-3">{row.feedback.occurredAt ?? row.originalDate ?? "—"}</td>
          <td className="break-words p-3 text-secondary">{row.errors.length ? <ul className="space-y-1">{row.errors.map(error => <li key={error}>{error}</li>)}</ul> : row.duplicateReason ?? "—"}</td>
        </tr>)}</tbody>
      </table>
      {!rows.length && <p role="status" className="p-6 text-sm text-secondary">No rows match this filter.</p>}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-secondary">
      <p role="status">{rows.length} rows · Page {page + 1} of {pages}</p>
      <div className="flex gap-2"><Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button></div>
    </div>
  </div>;
}
