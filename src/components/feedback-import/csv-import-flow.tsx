"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { executeCsvAction } from "@/app/app/import-execution-actions";
import { LoaderCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { detectCsvAction, previewCsvAction } from "@/app/app/import-preview-actions";
import { type ColumnMapping, type CsvDetection, type CsvImportPreview, validateCsvFile } from "@/features/feedback-import/csv";
import { ColumnMappingForm } from "./column-mapping-form";
import { ImportPreviewTable } from "./import-preview-table";

type Stage = "SELECT_FILE" | "PARSING" | "MAPPING" | "VALIDATING" | "PREVIEW" | "READY" | "IMPORTING";
export function CsvImportFlow({ organizationId, projectId, projectName }: { organizationId: string; projectId: string; projectName: string }) {
  const router = useRouter();
  const executionId = useRef<string | null>(null);
  const executing = useRef(false);
  const [stage, setStage] = useState<Stage>("SELECT_FILE");
  const [file, setFile] = useState<File | null>(null);
  const [detection, setDetection] = useState<CsvDetection | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [preview, setPreview] = useState<CsvImportPreview | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const heading = useRef<HTMLHeadingElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (stage !== "SELECT_FILE") heading.current?.focus(); }, [stage]);
  function requestData(selected: File) {
    const form = new FormData(); form.set("file", selected); form.set("organizationId", organizationId); form.set("projectId", projectId); return form;
  }
  function selectFile(selected?: File) {
    if (!selected || pending) return;
    setError(""); setPreview(null); setDetection(null); setMapping({});
    try { validateCsvFile(selected); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Choose a CSV file."); setFile(null); setStage("SELECT_FILE"); return; }
    setFile(selected); setStage("PARSING");
    startTransition(async () => {
      try {
        const result = await detectCsvAction(requestData(selected));
        if (result.error !== undefined) { setError(result.error); setStage("SELECT_FILE"); return; }
        setDetection(result.data); setMapping(result.data.mapping); setStage("MAPPING");
      } catch { setError("We couldn't read this CSV. Check your connection and sign-in, then try again."); setStage("SELECT_FILE"); }
    });
  }
  function buildPreview() {
    if (!file || pending) return;
    setError(""); setStage("VALIDATING");
    startTransition(async () => {
      try {
        const form = requestData(file); form.set("mapping", JSON.stringify(mapping));
        const result = await previewCsvAction(form);
        if (result.error !== undefined) { setError(result.error); setStage("MAPPING"); return; }
        setPreview(result.data); executionId.current = result.data.executionId; setStage("PREVIEW");
      } catch { setError("We couldn't validate this CSV. Check your connection and sign-in, then try again."); setStage("MAPPING"); }
    });
  }
  function executeImport() {
    if (!file || !executionId.current || pending || executing.current) return;
    executing.current = true;
    setError(""); setStage("IMPORTING");
    const form = requestData(file);
    form.set("mapping", JSON.stringify(mapping));
    form.set("executionId", executionId.current);
    startTransition(async () => {
      try {
        const result = await executeCsvAction(form);
        if (result.error !== undefined) { setError(result.error); setStage("READY"); return; }
        router.push(`/app/imports/${result.data.importId}`);
        router.refresh();
      } catch {
        setError("We couldn't confirm the outcome. Retry this confirmation or check import history before starting another import.");
        setStage("READY");
      } finally { executing.current = false; }
    });
  }
  const title = stage === "MAPPING" ? "Map columns" : stage === "PREVIEW" ? "Import preview" : stage === "READY" ? "Ready to import" : "Import feedback";
  return <section className="min-w-0 space-y-6 rounded-xl border border-border bg-surface p-5 sm:p-6" aria-busy={pending}>
    <div><h1 ref={heading} tabIndex={-1} className="text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-2 break-words text-sm text-secondary">Preview customer feedback for {projectName} before importing.</p></div>
    {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">{error}</p>}
    {stage === "SELECT_FILE" && <div className="rounded-lg border border-dashed border-border p-6 text-center sm:p-10" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (event.dataTransfer.files.length !== 1) { setError("Choose one CSV file at a time."); return; } selectFile(event.dataTransfer.files[0]); }}>
      <Upload aria-hidden="true" className="mx-auto mb-4 size-7 text-primary" />
      <p className="text-sm">Drag and drop your CSV here, or choose a file.</p>
      <label htmlFor="csv-file" className="sr-only">Choose CSV file</label>
      <input ref={input} id="csv-file" type="file" accept=".csv,text/csv" className="mt-5 block w-full min-w-0 rounded-md border border-border p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground" aria-describedby="csv-limits" onChange={event => { selectFile(event.target.files?.[0]); event.target.value = ""; }} />
      <p id="csv-limits" className="mt-4 text-xs leading-5 text-secondary">UTF-8 CSV only. Preview currently supports 512 KiB, 5,000 rows, and 100 columns. You can map columns and review issues before importing.</p>
    </div>}
    {(stage === "PARSING" || stage === "VALIDATING") && <p role="status" className="flex items-center gap-3 text-sm text-secondary"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />{stage === "PARSING" ? `Reading ${file?.name}…` : `Checking ${detection?.totalRows ?? ""} rows…`}</p>}
    {stage === "IMPORTING" && <p role="status" className="flex items-center gap-3 text-sm text-secondary"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Importing feedback… Please wait while we save your rows.</p>}
    {detection && stage !== "PARSING" && <div className="space-y-2 text-sm"><p className="break-words font-medium">{detection.fileName} · {detection.totalRows} rows · {detection.headers.length} columns</p>{stage === "MAPPING" && <p className="break-words text-secondary">Detected columns: {detection.headers.map(header => header.label).join(", ")}</p>}</div>}
    {stage === "MAPPING" && detection && <ColumnMappingForm headers={detection.headers} mapping={mapping} onChange={setMapping} onPreview={buildPreview} />}
    {(stage === "PREVIEW" || stage === "READY") && preview && <>
      <div className="grid grid-cols-3 gap-3">{[[preview.validRows, "Ready", "text-primary"], [preview.invalidRows, "Invalid", "text-destructive"], [preview.duplicateRows, "Duplicates", "text-warning"]].map(([count, label, color]) => <div key={label} className="rounded-lg border border-border bg-elevated p-3"><p className={`text-xl font-semibold ${color}`}>{count}</p><p className="mt-1 text-xs text-secondary">{label}</p></div>)}</div>
      {stage === "PREVIEW" && <ImportPreviewTable preview={preview} />}
      {preview.validRows === 0 && <p role="status" className="text-sm text-warning">{preview.duplicateRows > 0 && preview.invalidRows === 0 ? "No new feedback to import. All otherwise-valid rows are duplicates in this file or project." : "No rows are ready to import. Fix your column mapping or upload a corrected CSV."}</p>}
      <p className="text-sm text-secondary">{preview.validRows} rows eligible; {preview.invalidRows} invalid rows and {preview.duplicateRows} duplicates will be skipped. No feedback has been saved.</p>
      {stage === "READY" && <p role="status" className="rounded-lg border border-primary-border bg-primary-soft p-4 text-sm">Import feedback will save the ready rows to this project. Invalid rows and duplicates will be skipped. Final counts may change if feedback was added after preview.</p>}
      <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => { setPreview(null); setStage("MAPPING"); }}>Back to mapping</Button>{stage === "PREVIEW" ? <Button disabled={preview.validRows === 0} onClick={() => setStage("READY")}>Continue</Button> : <><Button variant="outline" onClick={() => setStage("PREVIEW")}>Back to preview</Button><Button disabled={pending || preview.validRows === 0} onClick={executeImport}>Import feedback</Button></>}</div>
    </>}
    {stage !== "SELECT_FILE" && stage !== "IMPORTING" && !pending && <Button variant="ghost" onClick={() => { setFile(null); setDetection(null); setPreview(null); setMapping({}); setError(""); setStage("SELECT_FILE"); requestAnimationFrame(() => input.current?.focus()); }}>Discard preview and choose another file</Button>}
  </section>;
}
