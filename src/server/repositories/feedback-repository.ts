import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";

export type FeedbackLookupDatabase = Pick<PrismaClient, "feedback">;
export async function findExistingFeedbackExternalIds(database: FeedbackLookupDatabase, { organizationId, projectId, externalIds }: { organizationId: string; projectId: string; externalIds: string[] }) {
  if (!externalIds.length) return new Set<string>();
  const matches = await database.feedback.findMany({
    where: { organizationId, projectId, externalId: { in: externalIds } },
    select: { externalId: true },
  });
  return new Set(matches.flatMap(({ externalId }) => externalId === null ? [] : [externalId]));
}
