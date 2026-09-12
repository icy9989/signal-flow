import { z } from "zod";

export type InboxSearchParams = Record<string, string | string[] | undefined>;
const text = z.string().trim().max(500).default("");
const date = z.union([z.literal(""), z.iso.date()]).default("");
export const inboxQuerySchema = z.object({
  q: text, source: z.string().max(500).default(""), importId: z.string().max(200).default(""),
  from: date, to: date, cursor: z.string().max(2000).default(""),
}).refine(value => !value.from || !value.to || value.from <= value.to, { message: "The start date must be on or before the end date." });
export type InboxQuery = z.infer<typeof inboxQuerySchema>;
export const defaultInboxQuery = inboxQuerySchema.parse({});
export function inboxHref(query: InboxQuery, cursor = query.cursor) {
  const params = new URLSearchParams();
  for (const key of ["q", "source", "importId", "from", "to"] as const) if (query[key]) params.set(key, query[key]);
  if (cursor) params.set("cursor", cursor);
  return `/app/feedback${params.size ? `?${params}` : ""}`;
}
