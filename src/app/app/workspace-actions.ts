"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import type { WorkspaceActionState } from "@/lib/validation/organization";
import { organizationService, switchActiveOrganization } from "@/server/auth/organization-context";
import { OrganizationError } from "@/server/services/organization-service";

function actionError(error: unknown, operation: string): WorkspaceActionState {
  unstable_rethrow(error);
  if (error instanceof OrganizationError) {
    return { error: { code: error.code, message: error.message, ...(error.code === "VALIDATION_ERROR" ? { field: "name" as const } : {}) } };
  }
  console.error({ operation, status: "failed", errorType: error instanceof Error ? error.name : "Unknown" });
  return { error: { code: "INTERNAL_ERROR", message: "We couldn't save your workspace. Please try again." } };
}

export async function createWorkspaceAction(_previous: WorkspaceActionState, formData: FormData): Promise<WorkspaceActionState> {
  try {
    const organization = await organizationService.createOrganizationForUser({ name: formData.get("name") });
    await switchActiveOrganization(organization.id);
  } catch (error) {
    return actionError(error, "create_workspace");
  }
  revalidatePath("/app", "layout");
  redirect("/app/overview");
}

export async function switchWorkspaceAction(_previous: WorkspaceActionState, formData: FormData): Promise<WorkspaceActionState> {
  try {
    await switchActiveOrganization(formData.get("organizationId"));
  } catch (error) {
    return actionError(error, "switch_workspace");
  }
  revalidatePath("/app", "layout");
  redirect("/app/overview");
}
