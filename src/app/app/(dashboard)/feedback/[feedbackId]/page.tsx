import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FeedbackBackLink, feedbackDate, feedbackLinkClass } from "@/components/feedback/inbox";
import { defaultInboxQuery, inboxQuerySchema, type InboxSearchParams } from "@/features/feedback/query";
import { requireProjectAccess, resolveProjectWorkspace } from "@/server/auth/project-context";
import { getDb } from "@/server/db/client";
import { createFeedbackInboxService } from "@/server/services/feedback-inbox-service";

export default async function FeedbackDetailPage({ params, searchParams }: {
  params: Promise<{ feedbackId: string }>; searchParams: Promise<InboxSearchParams>;
}) {
  const { activeProject } = await resolveProjectWorkspace();
  if (!activeProject) redirect("/app/onboarding");
  const { organization, project } = activeProject;
  const { feedbackId } = await params;
  const feedback = await createFeedbackInboxService({ requireProjectAccess, database: getDb }).detail({ organizationId: organization.id, projectId: project.id }, feedbackId);
  if (!feedback) notFound();
  const parsed = inboxQuerySchema.safeParse(await searchParams);
  return <div className="space-y-6"><FeedbackBackLink query={parsed.success ? parsed.data : defaultInboxQuery} />
    <header><h1 className="text-2xl font-semibold">Feedback detail</h1><p className="mt-2 break-words text-sm text-secondary">{project.name}</p></header>
    <section className="space-y-4 border-y border-border py-6"><h2 className="text-sm font-medium text-secondary">Original feedback</h2><p className="whitespace-pre-wrap break-words text-base leading-7">{feedback.content}</p></section>
    <section className="space-y-4"><h2 className="font-semibold">Metadata</h2><dl className="grid gap-6 text-sm sm:grid-cols-2 lg:grid-cols-3">
      {[["Source", feedback.source || "—"], ["Customer", feedback.customerReference ?? "—"], ["External ID", feedback.externalId ?? "—"], ["Occurred", feedbackDate(feedback.occurredAt, true)], ["Imported", feedbackDate(feedback.createdAt, true)]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-secondary">{label}</dt><dd className="mt-2 whitespace-pre-wrap break-words">{value}</dd></div>)}
      <div className="min-w-0"><dt className="text-secondary">Imported from</dt><dd className="mt-2 break-words">{feedback.import ? <Link className="underline underline-offset-4" href={`/app/imports/${encodeURIComponent(feedback.import.id)}`}>{feedback.import.fileName ?? feedback.import.id}</Link> : "—"}</dd></div>
    </dl>{feedback.import && <Link className={feedbackLinkClass} href={`/app/feedback?importId=${encodeURIComponent(feedback.import.id)}`}>View feedback from this import</Link>}</section>
  </div>;
}
