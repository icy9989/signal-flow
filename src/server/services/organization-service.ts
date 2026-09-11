import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma, type OrganizationRole } from "@/generated/prisma/client";
import { createOrganizationSchema, organizationIdSchema } from "@/lib/validation/organization";
import { createOrganizationWithOwner, findMembership, listMemberships, type OrganizationDatabase } from "@/server/repositories/organization-repository";

export class OrganizationError extends Error {
  constructor(public code: "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT", message: string) {
    super(message);
    this.name = "OrganizationError";
  }
}

export type OrganizationContext = {
  user: { id: string };
  organization: { id: string; name: string; slug: string };
  membership: { id: string; role: OrganizationRole };
};

type Dependencies = {
  requireUser: () => Promise<{ id: string }>;
  database: () => OrganizationDatabase;
};

// Dependencies are server-only, so tests can exercise the real authorization boundary.
export function createOrganizationService({ requireUser, database }: Dependencies) {
  async function requireOrganizationMembership({ organizationId }: { organizationId: unknown }): Promise<OrganizationContext> {
    const user = await requireUser();
    const parsed = organizationIdSchema.safeParse(organizationId);
    if (!parsed.success) throw new OrganizationError("NOT_FOUND", "Workspace unavailable.");
    const membership = await findMembership(database(), { userId: user.id, organizationId: parsed.data });
    if (!membership) throw new OrganizationError("NOT_FOUND", "Workspace unavailable.");
    return { user: { id: user.id }, organization: membership.organization, membership: { id: membership.id, role: membership.role } };
  }

  return {
    requireOrganizationMembership,

    async requireOrganizationRole({ organizationId, roles }: { organizationId: unknown; roles: readonly OrganizationRole[] }) {
      const context = await requireOrganizationMembership({ organizationId });
      if (!roles.includes(context.membership.role)) throw new OrganizationError("NOT_FOUND", "Workspace unavailable.");
      return context;
    },

    async listOrganizationsForUser() {
      const user = await requireUser();
      return listMemberships(database(), { userId: user.id });
    },

    async resolveActiveOrganization(preference?: string) {
      const user = await requireUser();
      const memberships = await listMemberships(database(), { userId: user.id });
      const selected = memberships.find(({ organization }) => organization.id === preference) ?? memberships[0];
      const active: OrganizationContext | null = selected ? {
        user: { id: user.id }, organization: selected.organization,
        membership: { id: selected.id, role: selected.role },
      } : null;
      return { memberships, active };
    },

    async createOrganizationForUser(input: unknown) {
      const user = await requireUser();
      const parsed = createOrganizationSchema.safeParse(input);
      if (!parsed.success) throw new OrganizationError("VALIDATION_ERROR", parsed.error.issues[0].message);
      const { name } = parsed.data;
      const base = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        .replace(/[^a-z0-9]+/g, "-").slice(0, 80).replace(/^-+|-+$/g, "") || "workspace";

      for (let attempt = 0; attempt < 6; attempt++) {
        const slug = attempt === 0 ? base : `${base}-${attempt < 5 ? attempt + 1 : randomUUID()}`;
        try {
          return await createOrganizationWithOwner(database(), { name, slug, userId: user.id });
        } catch (error) {
          // Slug is the only caller-derived unique field in this atomic write.
          // Prisma adapters expose constraint metadata differently; P2002 is stable.
          if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
        }
      }
      throw new OrganizationError("CONFLICT", "We couldn't reserve a workspace address. Please try again.");
    },
  };
}
