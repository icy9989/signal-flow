import "server-only";
import { cookies } from "next/headers";
import { requireOrganizationMembership, resolveActiveOrganization } from "@/server/auth/organization-context";
import { getDb } from "@/server/db/client";
import { createProjectService } from "@/server/services/project-service";
import { OrganizationError } from "@/server/services/organization-service";

export const ACTIVE_PROJECT_COOKIE = "signalflow-project";
export const projectService = createProjectService({ requireMembership: requireOrganizationMembership, database: getDb });
export const requireProjectAccess = projectService.requireProjectAccess;

export async function resolveProjectWorkspace() {
  const workspace = await resolveActiveOrganization();
  if (!workspace.active) return { ...workspace, projects: [], activeProject: null };
  const preference = (await cookies()).get(ACTIVE_PROJECT_COOKIE)?.value;
  const result = await projectService.resolveActiveProject({ organizationId: workspace.active.organization.id, preference });
  return { ...workspace, projects: result.projects, activeProject: result.active };
}

export async function requireActiveOrganization() {
  const { active } = await resolveActiveOrganization();
  if (!active) throw new OrganizationError("NOT_FOUND", "Workspace unavailable.");
  return active;
}

export async function switchActiveProject(projectId: unknown) {
  const { organization } = await requireActiveOrganization();
  const context = await projectService.switchActiveProject({ organizationId: organization.id, projectId });
  (await cookies()).set(ACTIVE_PROJECT_COOKIE, context.project.id, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/app", maxAge: 60 * 60 * 24 * 30,
  });
}
