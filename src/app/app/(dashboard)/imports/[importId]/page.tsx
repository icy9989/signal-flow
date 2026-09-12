import { notFound, redirect } from "next/navigation";
import { ImportResult } from "@/components/feedback-import/import-result";
import { resolveProjectWorkspace, requireProjectAccess } from "@/server/auth/project-context";
import { getDb } from "@/server/db/client";
import { createFeedbackImportService } from "@/server/services/feedback-import-service";

export default async function ImportDetailPage({ params }: { params: Promise<{ importId: string }> }) {
  const { activeProject } = await resolveProjectWorkspace();
  if (!activeProject) redirect("/app/onboarding");
  const { organization, project } = activeProject;
  const { importId } = await params;
  const record = await createFeedbackImportService({ requireProjectAccess, database: getDb }).detail({ organizationId: organization.id, projectId: project.id, importId });
  if (!record) notFound();
  return <ImportResult record={record} projectName={project.name} />;
}
