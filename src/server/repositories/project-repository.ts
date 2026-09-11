import "server-only";
import type { Prisma } from "@/generated/prisma/client";

export type ProjectDatabase = Pick<Prisma.TransactionClient, "project">;
const projectSelect = { id: true, name: true, description: true, createdAt: true, updatedAt: true } satisfies Prisma.ProjectSelect;

export function getProject(db: ProjectDatabase, { organizationId, projectId }: { organizationId: string; projectId: string }) {
  return db.project.findFirst({ where: { id: projectId, organizationId }, select: projectSelect });
}

export function listProjects(db: ProjectDatabase, { organizationId }: { organizationId: string }) {
  return db.project.findMany({ where: { organizationId }, select: projectSelect, orderBy: [{ createdAt: "desc" }, { id: "asc" }] });
}

export function createProject(db: ProjectDatabase, data: { organizationId: string; name: string; description?: string }) {
  return db.project.create({ data, select: projectSelect });
}
