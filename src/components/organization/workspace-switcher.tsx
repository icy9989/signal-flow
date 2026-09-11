"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Building2, Check, ChevronsUpDown, LoaderCircle, Plus } from "lucide-react";
import { switchWorkspaceAction } from "@/app/app/workspace-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Workspace = { id: string; name: string };

export function WorkspaceSwitcher({ workspaces, activeId }: { workspaces: Workspace[]; activeId?: string }) {
  const [state, action, pending] = useActionState(switchWorkspaceAction, {});
  const active = workspaces.find(({ id }) => id === activeId);

  return <Dialog>
    <DialogTrigger asChild>
      <button className="mb-6 flex w-full min-w-0 items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left hover:bg-hover" aria-label={`Switch workspace: ${active?.name ?? "No workspace"}`}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-primary-border bg-primary-soft"><Building2 aria-hidden="true" className="size-4 text-primary" /></span>
        <span className="min-w-0 flex-1"><span className="block text-[11px] text-secondary">Workspace</span><span className="block truncate text-sm font-medium">{active?.name ?? "Create your workspace"}</span></span>
        <ChevronsUpDown aria-hidden="true" className="size-3.5 shrink-0 text-secondary" />
      </button>
    </DialogTrigger>
    <DialogContent>
      <DialogTitle className="pr-8 text-lg font-semibold">Your workspaces</DialogTitle>
      <DialogDescription className="mt-1 text-sm text-secondary">Choose where you want to work.</DialogDescription>
      <form action={action} aria-busy={pending} className="mt-5 space-y-1">
        {workspaces.map((workspace) => {
          const row = <button key={workspace.id} type={workspace.id === activeId ? "button" : "submit"} name="organizationId" value={workspace.id} disabled={pending} aria-current={workspace.id === activeId ? "true" : undefined}
          className="flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left hover:border-border hover:bg-hover disabled:opacity-60 aria-current:border-primary-border aria-current:bg-primary-soft">
          <Building2 aria-hidden="true" className="size-4 shrink-0 text-secondary" /><span className="min-w-0 flex-1 break-words text-sm font-medium">{workspace.name}</span>{workspace.id === activeId && <><Check aria-hidden="true" className="size-4 shrink-0 text-primary" /><span className="sr-only">Current workspace</span></>}
        </button>;
          return workspace.id === activeId ? <DialogClose key={workspace.id} asChild>{row}</DialogClose> : row;
        })}
        {workspaces.length === 0 && <p className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm text-secondary">Create your first workspace to get started.</p>}
        {pending && <p role="status" className="flex items-center gap-2 p-3 text-sm text-secondary"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Switching workspace…</p>}
        {state.error && <p role="alert" className="p-3 text-sm text-secondary">{state.error.message}</p>}
      </form>
      <div className="mt-4 border-t border-border pt-4">
        {pending ? <Button variant="ghost" disabled className="w-full justify-start"><Plus />Create workspace</Button> : <DialogClose asChild><Link href="/app/workspaces/new" className="flex items-center gap-2 rounded-md p-3 text-sm text-secondary hover:bg-hover hover:text-primary"><Plus aria-hidden="true" className="size-4" />Create workspace</Link></DialogClose>}
      </div>
    </DialogContent>
  </Dialog>;
}
