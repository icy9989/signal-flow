import { CreateWorkspaceForm } from "@/components/organization/create-workspace-form";

export function WorkspaceStep() {
  return <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
    <p className="text-xs font-medium uppercase tracking-widest text-primary">Step 1 of 3</p>
    <h1 className="mt-3 text-2xl font-semibold tracking-tight">Create your workspace</h1>
    <p className="mb-7 mt-3 text-sm leading-6 text-secondary">Your workspace keeps your projects, customer feedback, and analysis organized in one place.</p>
    <CreateWorkspaceForm onboarding />
  </section>;
}
