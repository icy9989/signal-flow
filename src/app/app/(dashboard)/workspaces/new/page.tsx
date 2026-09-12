import type { Metadata } from "next";
import { Building2, FolderKanban, LockKeyhole } from "lucide-react";
import { CreateWorkspaceForm } from "@/components/organization/create-workspace-form";
import { requireApplicationUser } from "@/server/auth/require-application-user";

export const metadata: Metadata = { title: "Create workspace | SignalFlow" };

export default async function NewWorkspacePage() {
  await requireApplicationUser();
  return <div className="mx-auto max-w-2xl py-6 sm:py-12">
    <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">A shared home for your team</p>
    <h1 className="text-3xl font-semibold tracking-tight">Create workspace</h1>
    <p className="mt-3 max-w-lg text-sm leading-6 text-secondary">Keep your projects, feedback, and insights together in a space of their own.</p>
    <section className="mt-8 rounded-xl border border-border bg-surface p-6 sm:p-8" aria-label="Workspace details">
      <div className="mb-7 flex items-center gap-3 border-b border-border pb-6"><div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-primary-border bg-primary-soft"><Building2 aria-hidden="true" className="size-5 text-primary" /></div><div><h2 className="text-sm font-medium">Your workspace starts here</h2><p className="mt-1 text-xs text-secondary">You’ll be the owner of this workspace.</p></div></div>
      <CreateWorkspaceForm />
    </section>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <p className="flex gap-3 text-xs leading-5 text-secondary"><LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0" />Workspace data is private to its members.</p>
      <p className="flex gap-3 text-xs leading-5 text-secondary"><FolderKanban aria-hidden="true" className="mt-0.5 size-4 shrink-0" />Projects will organize your feedback by product.</p>
    </div>
  </div>;
}
