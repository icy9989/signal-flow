import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FolderPlus } from "lucide-react";
import { resolveActiveOrganization } from "@/server/auth/organization-context";
import { canCreateProject } from "@/server/services/project-service";
import { CreateProjectForm } from "@/components/project/create-project-form";

export const metadata: Metadata = { title: "Create project | SignalFlow" };
export default async function NewProjectPage() {
  const { active } = await resolveActiveOrganization();
  if (!active) redirect("/app/overview");
  if (!canCreateProject(active.membership.role)) return <div className="rounded-xl border border-border bg-surface p-8"><h1 className="text-xl font-semibold">Project creation is restricted</h1><p className="mt-2 text-sm text-secondary">Ask a workspace owner or admin to create a project.</p><Link href="/app/projects" className="mt-5 inline-block text-sm text-primary">Back to projects</Link></div>;
  return <div className="mx-auto max-w-xl py-4 sm:py-8">
    <Link href="/app/projects" className="mb-7 inline-flex items-center gap-2 text-sm text-secondary hover:text-foreground"><ArrowLeft aria-hidden="true" className="size-4" />All projects</Link>
    <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
      <div className="mb-5 flex size-11 items-center justify-center rounded-lg border border-primary-border bg-primary-soft"><FolderPlus aria-hidden="true" className="size-5 text-primary" /></div>
      <h1 className="text-2xl font-semibold tracking-tight">Create project</h1><p className="mt-2 break-words text-sm leading-6 text-secondary">Organize customer feedback and analysis inside <span className="text-foreground">{active.organization.name}</span>.</p><div className="mt-7"><CreateProjectForm key={active.organization.id} /></div>
    </section>
  </div>;
}
