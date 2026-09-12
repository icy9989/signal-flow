import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CsvImportFlow } from "@/components/feedback-import/csv-import-flow";
import { resolveProjectWorkspace } from "@/server/auth/project-context";

export const metadata: Metadata = { title: "Import feedback | SignalFlow" };
export default async function ImportFeedbackPage() {
  const { activeProject } = await resolveProjectWorkspace();
  if (!activeProject) redirect("/app/onboarding");
  const { organization, project, membership } = activeProject;
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") return <p role="status" className="rounded-xl border border-border bg-surface p-6 text-sm text-secondary">Only workspace owners and admins can import feedback. Ask an owner or admin to add feedback to this project.</p>;
  return <CsvImportFlow key={`${organization.id}:${project.id}`} organizationId={organization.id} projectId={project.id} projectName={project.name} />;
}
