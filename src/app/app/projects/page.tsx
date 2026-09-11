import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Folder, Plus } from "lucide-react";
import { resolveProjectWorkspace } from "@/server/auth/project-context";
import { canCreateProject } from "@/server/services/project-service";
import { ProjectEmptyState } from "@/components/project/project-empty-state";
import { SelectProjectButton } from "@/components/project/select-project-button";

export const metadata: Metadata = { title: "Projects | SignalFlow" };
export default async function ProjectsPage() {
  const { active, projects, activeProject } = await resolveProjectWorkspace();
  if (!active) redirect("/app/overview");
  const canCreate = canCreateProject(active.membership.role);
  return <div className="space-y-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="mb-2 truncate text-xs font-medium uppercase tracking-widest text-primary">{active.organization.name}</p><h1 className="text-3xl font-semibold tracking-tight">Projects</h1><p className="mt-2 text-sm text-secondary">A focused space for every product you build.</p></div>{canCreate && projects.length > 0 && <Link href="/app/projects/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"><Plus aria-hidden="true" className="size-4" />Create project</Link>}</div>
    {!projects.length ? <ProjectEmptyState canCreate={canCreate} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{projects.map(project => <article key={project.id} className={`flex min-w-0 flex-col rounded-xl border bg-surface p-5 ${project.id === activeProject?.project.id ? "border-primary-border" : "border-border"}`}>
      <div className="mb-5 flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-lg border border-border bg-elevated"><Folder aria-hidden="true" className="size-5 text-primary" /></span>{project.id === activeProject?.project.id && <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2 py-1 text-xs text-primary"><Check aria-hidden="true" className="size-3" />Active</span>}</div>
      <h2 className="break-words text-lg font-semibold">{project.name}</h2><p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-secondary">{project.description || "No description added."}</p>
      <p className="mt-auto pt-6 text-xs text-secondary">Updated <time dateTime={project.updatedAt.toISOString()}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(project.updatedAt)}</time></p>
      <div className="mt-4 border-t border-border pt-3"><SelectProjectButton projectId={project.id} /></div>
    </article>)}</div>}
  </div>;
}
