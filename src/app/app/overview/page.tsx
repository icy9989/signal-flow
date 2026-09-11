import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Check, FolderPlus, LockKeyhole, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveActiveOrganization } from "@/server/auth/organization-context";

export const metadata: Metadata = { title: "Overview | SignalFlow" };

export default async function OverviewPage() {
  const { active } = await resolveActiveOrganization();
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0"><p className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">Your feedback intelligence workspace</p><h1 className="text-3xl font-semibold tracking-tight">{active ? "Overview" : "Welcome to SignalFlow"}</h1><p className="mt-2 text-sm text-secondary">{active ? "A clearer view of your customers starts here." : "One place for customer feedback. A shared direction for your team."}</p></div>
      {active && <Button disabled title="Create a project before importing feedback"><Upload />Import feedback</Button>}
    </div>
    <section aria-labelledby="workspace-title" className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4 text-xs text-secondary"><span className="flex min-w-0 items-center gap-2"><Building2 aria-hidden="true" className="size-4 shrink-0" /><span className="truncate">{active?.organization.name ?? "Workspace setup"}</span></span><span className="shrink-0 rounded-full border border-border bg-elevated px-2.5 py-1">{active ? "Workspace ready" : "Get started"}</span></div>
      <div className="px-6 py-12 sm:px-10 sm:py-16">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-xl border border-primary-border bg-primary-soft">{active ? <FolderPlus aria-hidden="true" className="size-7 text-primary" /> : <Building2 aria-hidden="true" className="size-7 text-primary" />}</div>
          <h2 id="workspace-title" className="text-2xl font-semibold tracking-tight">{active ? "No projects yet" : "Create your workspace"}</h2>
          <p className="mt-3 text-sm leading-6 text-secondary">{active ? "Create your first project to start importing and analyzing customer feedback." : "Give your team a shared home for projects, feedback, and insights. Start by creating an organization workspace."}</p>
          <div className="mt-6">{active ? <><Button disabled><FolderPlus />Create project</Button><p className="mt-3 text-xs text-secondary">Project creation is coming next.</p></> : <Link href="/app/workspaces/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover">Create workspace<ArrowRight aria-hidden="true" className="size-4" /></Link>}</div>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-secondary"><LockKeyhole aria-hidden="true" className="size-3.5" />Private to your workspace members</p>
        </div>
      </div>
      <ol className="grid border-t border-border md:grid-cols-3">
        {[{ icon: Building2, title: "Create a workspace", description: "A shared home for your team." }, { icon: FolderPlus, title: "Add your project", description: "Organize feedback around a product." }, { icon: Upload, title: "Import feedback", description: "Turn customer voices into insight." }].map(({ icon: Icon, title, description }, index) => <li key={title} className="border-b border-border p-6 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0">
          <div className="mb-3 flex items-center justify-between"><Icon aria-hidden="true" className={`size-5 ${index === 0 ? "text-primary" : "text-secondary"}`} />{active && index === 0 ? <span className="flex items-center gap-1 text-xs text-primary"><Check aria-hidden="true" className="size-3.5" />Complete</span> : <span className="font-mono text-xs text-secondary">0{index + 1}</span>}</div>
          <h3 className="text-sm font-medium">{title}</h3><p className="mt-2 text-xs leading-5 text-secondary">{description}</p>
        </li>)}
      </ol>
    </section>
  </div>;
}
