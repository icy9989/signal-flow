import { Suspense } from "react";
import { redirect } from "next/navigation";
import { FeedbackInbox, InboxHeader, InvalidInboxQuery } from "@/components/feedback/inbox";
import type { InboxSearchParams } from "@/features/feedback/query";
import { resolveProjectWorkspace, requireProjectAccess } from "@/server/auth/project-context";
import { getDb } from "@/server/db/client";
import { createFeedbackInboxService, InboxQueryError } from "@/server/services/feedback-inbox-service";
import FeedbackLoading from "./loading";

async function InboxResults({ searchParams }: { searchParams: InboxSearchParams }) {
  const { activeProject } = await resolveProjectWorkspace();
  if (!activeProject) redirect("/app/onboarding");
  const { organization, project, membership } = activeProject;
  const canImport = membership.role === "OWNER" || membership.role === "ADMIN";
  let result;
  let validationMessage;
  try {
    result = await createFeedbackInboxService({ requireProjectAccess, database: getDb }).list({ organizationId: organization.id, projectId: project.id }, searchParams);
  } catch (error) {
    if (!(error instanceof InboxQueryError)) throw error;
    validationMessage = error.message;
  }
  return <div className="space-y-6"><InboxHeader projectName={project.name} canImport={canImport} />{result ? <FeedbackInbox result={result} canImport={canImport} /> : <InvalidInboxQuery message={validationMessage ?? "Check your filters."} />}</div>;
}
export default async function FeedbackPage({ searchParams }: { searchParams: Promise<InboxSearchParams> }) {
  const query = await searchParams;
  return <Suspense key={JSON.stringify(query)} fallback={<FeedbackLoading />}><InboxResults searchParams={query} /></Suspense>;
}
