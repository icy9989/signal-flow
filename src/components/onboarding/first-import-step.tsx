import { CsvImportFlow } from "@/components/feedback-import/csv-import-flow";

export function FirstImportStep({ projectName, organizationId, projectId, canImport }: { projectName: string; organizationId: string; projectId: string; canImport: boolean }) {
  return <div className="space-y-4">
    <p className="text-xs font-medium uppercase tracking-widest text-primary">Step 3 of 3</p>
    {canImport ? <CsvImportFlow organizationId={organizationId} projectId={projectId} projectName={projectName} /> : <p role="status" className="rounded-xl border border-border bg-surface p-6 text-sm text-secondary">Ask a workspace owner or admin to import feedback for {projectName}.</p>}
  </div>;
}
