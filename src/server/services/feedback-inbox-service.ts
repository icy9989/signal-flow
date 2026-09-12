import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { inboxQuerySchema, type InboxQuery } from "@/features/feedback/query";
import { listFeedback, getFeedback, getFeedbackImport, type InboxDatabase, type FeedbackScope } from "@/server/repositories/feedback-inbox-repository";
import type { createProjectService } from "@/server/services/project-service";

export class InboxQueryError extends Error {}
const cursorSchema = z.object({ id: z.string().min(1).max(200), createdAt: z.iso.datetime(), direction: z.enum(["next", "previous"]), fingerprint: z.string() });
function fingerprint(scope: FeedbackScope, query: InboxQuery) {
  return createHash("sha256").update(JSON.stringify([scope.organizationId, scope.projectId, query.q, query.source, query.importId, query.from, query.to])).digest("hex");
}
function readPosition(cursor: string, expected: string) {
  if (!cursor) return undefined;
  try {
    const parsed = cursorSchema.parse(JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")));
    // A cursor from another project or filter set must start a fresh page.
    return parsed.fingerprint === expected ? parsed : undefined;
  } catch { throw new InboxQueryError("This page link is invalid. Clear filters to start again."); }
}
export function createFeedbackInboxService({ requireProjectAccess, database }: {
  requireProjectAccess: ReturnType<typeof createProjectService>["requireProjectAccess"];
  database: () => InboxDatabase;
}) {
  async function authorize(input: FeedbackScope) {
    const context = await requireProjectAccess(input);
    return { organizationId: context.organization.id, projectId: context.project.id };
  }
  return {
    async list(input: FeedbackScope, rawQuery: unknown = {}) {
      const scope = await authorize(input);
      const parsed = inboxQuerySchema.safeParse(rawQuery);
      if (!parsed.success) throw new InboxQueryError("Check your search and filters. Use valid dates with the start on or before the end.");
      const query = parsed.data;
      const db = database();
      if (query.importId && !await getFeedbackImport(db, scope, query.importId)) throw new InboxQueryError("This import is unavailable in the active project. Clear filters to continue.");
      // Escape LIKE metacharacters so substring searches treat customer input literally.
      const keyword = query.q.replace(/[\\%_]/g, "\\$&");
      const filters: Prisma.FeedbackWhereInput = {
        ...(keyword ? { OR: ["content", "externalId", "customerReference"].map(field => ({ [field]: { contains: keyword, mode: "insensitive" } })) } : {}),
        ...(query.source ? { source: query.source } : {}),
        ...(query.importId ? { importId: query.importId } : {}),
        ...(query.from || query.to ? { occurredAt: {
          ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000Z`) } : {}),
          ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
        } } : {}),
      };
      const key = fingerprint(scope, query);
      const position = readPosition(query.cursor, key);
      const [page, total, projectTotal, sources, imports] = await Promise.all([
        listFeedback(db, scope, { filters, position }),
        db.feedback.count({ where: { AND: [scope, filters] } }),
        db.feedback.count({ where: scope }),
        db.feedback.groupBy({ by: ["source"], where: scope, orderBy: { source: "asc" } }),
        db.feedbackImport.findMany({ where: scope, select: { id: true, fileName: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
      ]);
      const cursorFor = (row: (typeof page.items)[number] | undefined, direction: "next" | "previous") => row ? Buffer.from(JSON.stringify({ id: row.id, createdAt: row.createdAt.toISOString(), direction, fingerprint: key })).toString("base64url") : null;
      return { ...page, query, total, projectTotal, sources, imports,
        nextCursor: page.hasNext ? cursorFor(page.items.at(-1), "next") : null,
        previousCursor: page.hasPrevious ? cursorFor(page.items[0], "previous") : null,
      };
    },
    async detail(input: FeedbackScope, feedbackId: unknown) {
      const scope = await authorize(input);
      const parsed = z.string().min(1).max(200).safeParse(feedbackId);
      if (!parsed.success) return null;
      const feedback = await getFeedback(database(), scope, parsed.data);
      if (!feedback) return null;
      return { ...feedback, import: feedback.importId ? await getFeedbackImport(database(), scope, feedback.importId) : null };
    },
  };
}
