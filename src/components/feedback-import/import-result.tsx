import Link from "next/link";
import { RefreshImportStatus } from "./refresh-import-status";
import { ImportStatusBadge } from "./import-status-badge";
import type { getFeedbackImport } from "@/server/repositories/import-repository";

type ImportRecord = NonNullable<Awaited<ReturnType<typeof getFeedbackImport>>>;
export function ImportResult({ record, projectName }: { record: ImportRecord; projectName: string }) {
  const complete = record.status === "COMPLETED";
  const failed = record.status === "FAILED";
  const title = failed ? "Import failed" : complete ? record.importedRows > 0 ? "Import complete" : "No new feedback was imported" : "Import in progress";
  return <section className="space-y-6 rounded-xl border border-border bg-surface p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold tracking-tight">{title}</h1><ImportStatusBadge status={record.status} /></div>
    <div className="space-y-1"><p className="break-words font-medium">{record.fileName}</p><p className="break-words text-sm text-secondary">Project: {projectName}</p></div>
    {failed && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm">{record.errorMessage ?? "We couldn't save this feedback import."}</p>}
    {complete && record.importedRows === 0 && <p className="text-sm text-secondary">All rows were invalid or already existed in this project.</p>}
    {!complete && !failed && <p role="status" className="text-sm text-secondary">This attempt has not reported a final outcome yet. Refresh to check its status. Do not start another import of this file while it is pending.</p>}
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[[record.totalRows, "Total rows"], [record.importedRows, "Imported"], [record.invalidRows, "Invalid rows skipped"], [record.totalRows - record.invalidRows - record.validRows, "Duplicates skipped"]].map(([value, label]) => <div key={label} className="rounded-lg border border-border bg-elevated p-3"><dt className="text-xs text-secondary">{label}</dt><dd className="mt-2 text-xl font-semibold">{value}</dd></div>)}</dl>
    <dl className="flex flex-wrap gap-6 text-sm">{[["Created", record.createdAt], ["Updated", record.updatedAt]].map(([label, date]) => <div key={String(label)}><dt className="text-secondary">{String(label)} (UTC)</dt><dd className="mt-1">{date instanceof Date ? date.toISOString().replace("T", " ").slice(0, 19) : ""}</dd></div>)}</dl>
    <div className="flex flex-wrap gap-3">{complete && record.importedRows > 0 && <Link className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover" href="/app/feedback">View feedback</Link>}<Link className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-hover" href="/app/imports">Import history</Link>{(complete || failed) && <Link className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-hover" href="/app/imports/new">{failed ? "Try again with a new preview" : "Import another CSV"}</Link>}{!complete && !failed && <RefreshImportStatus />}</div>
  </section>;
}
