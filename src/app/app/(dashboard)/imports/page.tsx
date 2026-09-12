import Link from "next/link";
import { redirect } from "next/navigation";
import { ImportStatusBadge } from "@/components/feedback-import/import-status-badge";
import { resolveProjectWorkspace, requireProjectAccess } from "@/server/auth/project-context";
import { getDb } from "@/server/db/client";
import { createFeedbackImportService } from "@/server/services/feedback-import-service";

export default async function ImportHistoryPage() {
  const { activeProject } = await resolveProjectWorkspace();
  if (!activeProject) redirect("/app/onboarding");
  const { organization, project, membership } = activeProject;
  const history = await createFeedbackImportService({ requireProjectAccess, database: getDb }).list({ organizationId: organization.id, projectId: project.id });
  const canImport = membership.role === "OWNER" || membership.role === "ADMIN";
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">Import history</h1><p className="mt-2 break-words text-sm text-secondary">{project.name} · Latest 50 imports, newest first</p></div>{canImport && <Link href="/app/imports/new" className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover">Import feedback</Link>}</header>
    {!history.length ? <section className="rounded-xl border border-border bg-surface p-8"><h2 className="font-semibold">No imports yet</h2><p className="mt-2 text-sm text-secondary">{canImport ? "Upload your first CSV to start adding customer feedback." : "Ask a workspace owner or admin to import feedback."}</p></section> : <div className="overflow-x-auto rounded-xl border border-border bg-surface"><table className="w-full text-left text-sm"><caption className="sr-only">Previous CSV imports for {project.name}</caption><thead className="border-b border-border text-xs text-secondary"><tr>{["File", "Status", "Imported", "Invalid", "Duplicates", "Created (UTC)"].map(label => <th key={label} className="whitespace-nowrap px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{history.map(record => <tr key={record.id} className="border-b border-border last:border-0 hover:bg-hover"><td className="max-w-72 break-words px-4 py-4"><Link className="font-medium underline decoration-border underline-offset-4 hover:text-primary" href={`/app/imports/${record.id}`}>{record.fileName}</Link></td><td className="px-4 py-4"><ImportStatusBadge status={record.status} /></td><td className="px-4 py-4 tabular-nums">{record.importedRows}</td><td className="px-4 py-4 tabular-nums">{record.invalidRows}</td><td className="px-4 py-4 tabular-nums">{record.totalRows - record.invalidRows - record.validRows}</td><td className="whitespace-nowrap px-4 py-4 text-secondary">{record.createdAt.toISOString().replace("T", " ").slice(0, 16)}</td></tr>)}</tbody></table></div>}
  </div>;
}
