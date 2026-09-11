import Link from "next/link";
import { FolderPlus } from "lucide-react";

export function ProjectEmptyState({ canCreate }: { canCreate: boolean }) {
  return <section className="rounded-xl border border-border bg-surface px-6 py-16 text-center">
    <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl border border-primary-border bg-primary-soft"><FolderPlus aria-hidden="true" className="size-7 text-primary" /></div>
    <h2 className="text-2xl font-semibold tracking-tight">No projects yet</h2>
    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-secondary">{canCreate ? "Create your first project to organize customer feedback inside this workspace." : "Ask a workspace owner or admin to create your first project."}</p>
    {canCreate && <Link href="/app/projects/new" className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"><FolderPlus aria-hidden="true" className="size-4" />Create project</Link>}
  </section>;
}
