import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { createProjectSchema } from "@/lib/validation/project";
import { z } from "zod";
import { createProject, getProject, listProjects, type ProjectDatabase } from "@/server/repositories/project-repository";
import type { OrganizationContext } from "@/server/services/organization-service";

export class ProjectError extends Error {
  constructor(public code: "PROJECT_NOT_FOUND" | "VALIDATION_ERROR" | "PROJECT_NAME_CONFLICT" | "FORBIDDEN", message: string, public field?: "name" | "description") {
    super(message);
    this.name = "ProjectError";
  }
}

type Dependencies = {
  requireMembership: (input: { organizationId: unknown }) => Promise<OrganizationContext>;
  database: () => ProjectDatabase;
};

export function createProjectService({ requireMembership, database }: Dependencies) {
  async function requireProjectAccess({ organizationId, projectId }: { organizationId: unknown; projectId: unknown }) {
    const context = await requireMembership({ organizationId });
    const parsed = z.string().trim().min(1).safeParse(projectId);
    if (!parsed.success) throw new ProjectError("PROJECT_NOT_FOUND", "Project unavailable.");
    const project = await getProject(database(), { organizationId: context.organization.id, projectId: parsed.data });
    if (!project) throw new ProjectError("PROJECT_NOT_FOUND", "Project unavailable.");
    return { ...context, project };
  }

  return {
    requireProjectAccess,
    async createProjectForOrganization({ organizationId, input }: { organizationId: unknown; input: unknown }) {
      const context = await requireMembership({ organizationId });
      if (!canCreateProject(context.membership.role)) throw new ProjectError("FORBIDDEN", "Only workspace owners and admins can create projects.");
      const parsed = createProjectSchema.safeParse(input);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        throw new ProjectError("VALIDATION_ERROR", issue.message, issue.path[0] === "description" ? "description" : "name");
      }
      try {
        return await createProject(database(), { organizationId: context.organization.id, name: parsed.data.name, description: parsed.data.description || undefined });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw new ProjectError("PROJECT_NAME_CONFLICT", "A project with this name already exists in this workspace.", "name");
        }
        throw error;
      }
    },
    switchActiveProject: requireProjectAccess,
    async listProjectsForOrganization({ organizationId }: { organizationId: unknown }) {
      const context = await requireMembership({ organizationId });
      return listProjects(database(), { organizationId: context.organization.id });
    },
    async resolveActiveProject({ organizationId, preference }: { organizationId: unknown; preference?: string }) {
      const context = await requireMembership({ organizationId });
      const projects = await listProjects(database(), { organizationId: context.organization.id });
      const project = projects.find(({ id }) => id === preference) ?? projects[0];
      return { projects, active: project ? { ...context, project } : null };
    },
  };
}

export function canCreateProject(role: OrganizationContext["membership"]["role"]) {
  return role === "OWNER" || role === "ADMIN";
}
