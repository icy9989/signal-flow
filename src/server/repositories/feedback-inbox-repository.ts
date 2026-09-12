import "server-only";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

export type InboxDatabase = Pick<PrismaClient, "feedback" | "feedbackImport">;
export type FeedbackScope = { organizationId: string; projectId: string };
function requireScope(scope: FeedbackScope) {
  if (!scope.organizationId || !scope.projectId) throw new Error("Feedback scope is required.");
}
export type FeedbackPosition = { id: string; createdAt: string; direction: "next" | "previous" };
export const feedbackSelect = {
  id: true, content: true, source: true, externalId: true,
  customerReference: true, occurredAt: true, createdAt: true, importId: true,
} satisfies Prisma.FeedbackSelect;

export async function listFeedback(database: InboxDatabase, scope: FeedbackScope, options: {
  position?: FeedbackPosition; limit?: number; filters?: Prisma.FeedbackWhereInput;
} = {}) {
  requireScope(scope);
  const requestedLimit = options.limit ?? 25;
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(50, Math.floor(requestedLimit))) : 25;
  const position = options.position;
  const previous = position?.direction === "previous";
  const comparison = previous ? "gt" : "lt";
  const boundary: Prisma.FeedbackWhereInput = position ? { OR: [
    { createdAt: { [comparison]: new Date(position.createdAt) } },
    { createdAt: new Date(position.createdAt), id: { [comparison]: position.id } },
  ] } : {};
  const rows = await database.feedback.findMany({
    where: { AND: [scope, options.filters ?? {}, boundary] }, select: feedbackSelect,
    orderBy: [{ createdAt: previous ? "asc" : "desc" }, { id: previous ? "asc" : "desc" }], take: limit + 1,
  });
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);
  if (previous) items.reverse();
  return { items, hasNext: previous ? !!position : hasMore, hasPrevious: previous ? hasMore : !!position };
}

export function getFeedback(database: InboxDatabase, scope: FeedbackScope, feedbackId: string) {
  requireScope(scope);
  return database.feedback.findFirst({ where: { ...scope, id: feedbackId }, select: feedbackSelect });
}

export function getFeedbackImport(database: InboxDatabase, scope: FeedbackScope, importId: string) {
  requireScope(scope);
  return database.feedbackImport.findFirst({ where: { ...scope, id: importId }, select: { id: true, fileName: true } });
}
