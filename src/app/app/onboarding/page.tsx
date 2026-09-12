import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { WorkspaceStep } from "@/components/onboarding/workspace-step";
import { ProjectStep } from "@/components/onboarding/project-step";
import { FirstImportStep } from "@/components/onboarding/first-import-step";
import { WorkspaceSwitcher } from "@/components/organization/workspace-switcher";
import { ProjectSelector } from "@/components/project/project-selector";
import { resolveOnboardingState } from "@/server/onboarding/resolve-onboarding-state";
import { canCreateProject } from "@/server/services/project-service";

export const metadata: Metadata = { title: "Get started | SignalFlow" };

export default async function OnboardingPage() {
  const { step, organization, project, workspace } = await resolveOnboardingState();
  if (step === "COMPLETE") redirect("/app/feedback");
  const canCreate = !!workspace.active && canCreateProject(workspace.active.membership.role);

  return <>
    <OnboardingProgress step={step} />
    {organization && <div className="mb-5 grid min-w-0 gap-2 sm:grid-cols-2">
      <WorkspaceSwitcher key={organization.id} workspaces={workspace.memberships.map(({ organization }) => organization)} activeId={organization.id} />
      {project && <ProjectSelector key={project.id} projects={workspace.projects.map(({ id, name }) => ({ id, name }))} activeId={project.id} canCreate={canCreate} />}
    </div>}
    {step === "WORKSPACE" && <WorkspaceStep />}
    {step === "PROJECT" && <ProjectStep key={organization?.id} canCreate={canCreate} />}
    {step === "FIRST_IMPORT" && project && organization && <FirstImportStep key={`${organization.id}:${project.id}`} organizationId={organization.id} projectId={project.id} projectName={project.name} canImport={canCreate} />}
  </>;
}
