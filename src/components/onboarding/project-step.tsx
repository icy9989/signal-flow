import { CreateProjectForm } from "@/components/project/create-project-form";

export function ProjectStep({ canCreate }: { canCreate: boolean }) {
  return <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
    <p className="text-xs font-medium uppercase tracking-widest text-primary">Step 2 of 3</p>
    <h1 className="mt-3 text-2xl font-semibold tracking-tight">Create your first project</h1>
    <p className="mb-7 mt-3 text-sm leading-6 text-secondary">Projects organize feedback for a specific product or area of your business.</p>
    {canCreate ? <CreateProjectForm onboarding /> : <p role="status" className="rounded-lg border border-border bg-elevated p-4 text-sm leading-6 text-secondary">Ask a workspace owner or admin to create your first project. Your workspace is already saved.</p>}
  </section>;
}
