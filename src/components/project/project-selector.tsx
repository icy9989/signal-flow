"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Check, ChevronsUpDown, Folder, LoaderCircle, Plus } from "lucide-react";
import { switchProjectAction } from "@/app/app/project-actions";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export type ProjectSelectorProps = { projects: { id: string; name: string }[]; activeId?: string; canCreate: boolean };

export function ProjectSelector({ projects, activeId, canCreate }: ProjectSelectorProps) {
  const [state, action, pending] = useActionState(switchProjectAction, {});
  const active = projects.find(project => project.id === activeId);
  return <Dialog>
    <DialogTrigger asChild><button className="mb-5 flex w-full min-w-0 items-center gap-3 rounded-lg border border-border bg-elevated px-3 py-2.5 text-left hover:bg-hover" aria-label={`Switch project: ${active?.name ?? "No project"}`}>
      <Folder aria-hidden="true" className="size-4 shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block text-[11px] text-secondary">Project</span><span className="block truncate text-sm font-medium">{active?.name ?? "No projects yet"}</span></span><ChevronsUpDown aria-hidden="true" className="size-3.5 shrink-0 text-secondary" />
    </button></DialogTrigger>
    <DialogContent>
      <DialogTitle className="pr-8 text-lg font-semibold">Switch project</DialogTitle>
      <DialogDescription className="mt-1 text-sm text-secondary">Projects in your current workspace.</DialogDescription>
      <form action={action} aria-busy={pending} className="mt-5 max-h-[50dvh] space-y-1 overflow-y-auto">
        {projects.map(project => {
          const row = <button type={project.id === activeId ? "button" : "submit"} name="projectId" value={project.id} disabled={pending} aria-current={project.id === activeId ? "true" : undefined} className="flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left hover:border-border hover:bg-hover disabled:opacity-60 aria-current:border-primary-border aria-current:bg-primary-soft"><Folder aria-hidden="true" className="size-4 shrink-0 text-secondary" /><span className="min-w-0 flex-1 break-words text-sm">{project.name}</span>{project.id === activeId && <Check aria-label="Current project" className="size-4 shrink-0 text-primary" />}</button>;
          return project.id === activeId ? <DialogClose key={project.id} asChild>{row}</DialogClose> : <div key={project.id}>{row}</div>;
        })}
        {!projects.length && <p className="p-3 text-sm text-secondary">No projects yet. {canCreate ? "Create your first project to get started." : "Ask an owner or admin to create a project."}</p>}
        {pending && <p role="status" className="flex items-center gap-2 p-3 text-sm text-secondary"><LoaderCircle className="size-4 animate-spin" />Switching project…</p>}
        {state.error && <p role="alert" className="p-3 text-sm">{state.error.message}</p>}
      </form>
      {!pending && <div className="mt-4 space-y-1 border-t border-border pt-4">
        {canCreate && <DialogClose asChild><Link href="/app/projects/new" className="flex items-center gap-2 rounded-md p-3 text-sm text-primary hover:bg-primary-soft"><Plus aria-hidden="true" className="size-4" />Create project</Link></DialogClose>}
        <DialogClose asChild><Link href="/app/projects" className="block rounded-md p-3 text-sm text-secondary hover:bg-hover">View all projects</Link></DialogClose>
      </div>}
    </DialogContent>
  </Dialog>;
}
