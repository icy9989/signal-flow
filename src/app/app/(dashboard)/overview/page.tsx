import type { Metadata } from "next";
import Link from "next/link";
import { Check, Upload } from "lucide-react";
import { redirect } from "next/navigation";
import { resolveOnboardingState } from "@/server/onboarding/resolve-onboarding-state";

export const metadata: Metadata = { title: "Overview | SignalFlow" };

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const state = await resolveOnboardingState();
  if (state.step !== "COMPLETE") redirect("/app/onboarding");
  const { active, activeProject } = state.workspace;
  const { created } = await searchParams;
  if (!active || !activeProject) redirect("/app/onboarding");
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0"><p className="mb-2 truncate text-xs font-medium uppercase tracking-widest text-primary">{active.organization.name}</p><h1 className="break-words text-3xl font-semibold tracking-tight">{activeProject?.project.name ?? "Overview"}</h1><p className="mt-2 text-sm text-secondary">Your project’s customer feedback and analysis.</p></div>
      <Link href="/app/projects" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-hover">All projects</Link>
    </div>
    <>
      {created === "1" && <p role="status" className="flex items-center gap-2 rounded-lg border border-primary-border bg-primary-soft p-3 text-sm"><Check aria-hidden="true" className="size-4 text-primary" />Project created</p>}
      {activeProject.project.description && <p className="whitespace-pre-wrap break-words text-sm leading-6 text-secondary">{activeProject.project.description}</p>}
      <section className="rounded-xl border border-border bg-surface px-6 py-16 text-center">
        <Upload aria-hidden="true" className="mx-auto mb-5 size-8 text-primary" />
        <h2 className="text-xl font-semibold">Your first feedback is imported</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-secondary">Your feedback is saved. Open your feedback to review the imported rows. Analysis is coming next.</p>
        <Link href="/app/feedback" className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"><Upload aria-hidden="true" className="size-4" />View feedback</Link>
      </section>
    </>
  </div>;
}
