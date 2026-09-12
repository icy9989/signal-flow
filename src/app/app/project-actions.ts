"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import type { ProjectActionState } from "@/lib/validation/project";
import { projectService, requireActiveOrganization, resolveProjectWorkspace, switchActiveProject } from "@/server/auth/project-context";
import { ProjectError } from "@/server/services/project-service";
import { OrganizationError } from "@/server/services/organization-service";

function actionError(error: unknown, operation: string): ProjectActionState {
  unstable_rethrow(error);
  if (error instanceof ProjectError) return { error: { code: error.code, message: error.message, field: error.field } };
  if (error instanceof OrganizationError) return { error: { code: error.code, message: error.message } };
  console.error({ operation, status: "failed", errorType: error instanceof Error ? error.name : "Unknown" });
  return { error: { code: "INTERNAL_ERROR", message: operation === "create_project" ? "We couldn't create your project. Please refresh and try again." : "We couldn't save your project selection. Please refresh and try again." } };
}

export async function createProjectAction(_previous: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const onboarding = formData.get("flow") === "onboarding";
  try {
    if (onboarding && (await resolveProjectWorkspace()).activeProject) redirect("/app/onboarding");
    const { organization } = await requireActiveOrganization();
    const project = await projectService.createProjectForOrganization({ organizationId: organization.id, input: { name: formData.get("name"), description: formData.get("description") ?? undefined } });
    await switchActiveProject(project.id);
  } catch (error) { return actionError(error, "create_project"); }
  revalidatePath("/app", "layout");
  redirect(onboarding ? "/app/onboarding" : "/app/overview?created=1");
}

export async function switchProjectAction(_previous: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  try { await switchActiveProject(formData.get("projectId")); }
  catch (error) { return actionError(error, "switch_project"); }
  revalidatePath("/app", "layout");
  redirect("/app/overview");
}
