import "server-only";

import type { Prisma } from "@/generated/prisma/client";

export type OrganizationDatabase = Pick<Prisma.TransactionClient, "organization" | "organizationMember">;

const organizationSelect = { id: true, name: true, slug: true } satisfies Prisma.OrganizationSelect;
const membershipSelect = {
  id: true,
  role: true,
  organization: { select: organizationSelect },
} satisfies Prisma.OrganizationMemberSelect;

export function listMemberships(db: OrganizationDatabase, { userId }: { userId: string }) {
  return db.organizationMember.findMany({
    where: { userId },
    select: membershipSelect,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
}

export function findMembership(db: OrganizationDatabase, { organizationId, userId }: { organizationId: string; userId: string }) {
  return db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: membershipSelect,
  });
}

export function createOrganizationWithOwner(db: OrganizationDatabase, { name, slug, userId }: { name: string; slug: string; userId: string }) {
  // Prisma nested writes are one transaction: an invalid owner rolls back the organization too.
  return db.organization.create({
    data: { name, slug, memberships: { create: { userId, role: "OWNER" } } },
    select: organizationSelect,
  });
}
