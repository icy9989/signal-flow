import "server-only";

import { resolveProjectWorkspace } from "@/server/auth/project-context";
import { getDb } from "@/server/db/client";
import { hasCompletedFirstImport } from "@/server/repositories/import-repository";

export type OnboardingStep = "WORKSPACE" | "PROJECT" | "FIRST_IMPORT" | "COMPLETE";

// The existing context resolver authenticates and revalidates both preferences.
// Never accept a step or ownership context from browser input.
export async function resolveOnboardingState() {
  const workspace = await resolveProjectWorkspace();
  const organization = workspace.active?.organization ?? null;
  const project = workspace.activeProject?.project ?? null;
  let step: OnboardingStep = "WORKSPACE";

  if (organization) {
    step = "PROJECT";
    if (project) {
      const completed = await hasCompletedFirstImport(getDb(), {
        organizationId: organization.id,
        projectId: project.id,
      });
      step = completed ? "COMPLETE" : "FIRST_IMPORT";
    }
  }

  return { step, organization, project, workspace };
}
