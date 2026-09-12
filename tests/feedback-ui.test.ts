import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FeedbackInbox, FeedbackBackLink } from "../src/components/feedback/inbox";
import { inboxQuerySchema } from "../src/features/feedback/query";

const query = inboxQuerySchema.parse({ q: "crash", source: "Support", cursor: "current-page" });
const result = {
  query, items: [{ id: "feedback-1", content: "<script>alert(1)</script>\nOriginal feedback", source: "Support", customerReference: null, externalId: null, occurredAt: null, createdAt: new Date("2026-09-11T00:00:00Z"), importId: null }],
  sources: [{ source: "Support" }], imports: [], total: 1, projectTotal: 1,
  hasNext: true, hasPrevious: true, nextCursor: "next-page", previousCursor: "previous-page",
};
test("inbox renders safe text, labeled filters, stateful links and pagination reset", () => {
  const html = renderToStaticMarkup(createElement(FeedbackInbox, { result, canImport: true }));
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes('role="search"'));
  assert.ok(html.includes('name="q"'));
  assert.ok(!html.includes('name="cursor"'));
  assert.ok(html.includes("/app/feedback/feedback-1?q=crash&amp;source=Support&amp;cursor=current-page"));
  assert.ok(html.includes("cursor=previous-page"));
  assert.ok(html.includes("cursor=next-page"));
  assert.ok(html.includes("Clear filters"));
  assert.ok(html.includes("—"));
  assert.ok(renderToStaticMarkup(createElement(FeedbackBackLink, { query })).includes("cursor=current-page"));
});
test("empty and no-match states remain distinct and import permissions are respected", () => {
  const empty = { ...result, items: [], total: 0, projectTotal: 0, query: inboxQuerySchema.parse({}), nextCursor: null, previousCursor: null };
  const html = renderToStaticMarkup(createElement(FeedbackInbox, { result: empty, canImport: true }));
  assert.ok(html.includes("No feedback yet"));
  assert.ok(html.includes('href="/app/imports/new"'));
  const member = renderToStaticMarkup(createElement(FeedbackInbox, { result: empty, canImport: false }));
  assert.ok(!member.includes('href="/app/imports/new"'));
  const noMatch = renderToStaticMarkup(createElement(FeedbackInbox, { result: { ...empty, projectTotal: 40 }, canImport: true }));
  assert.ok(noMatch.includes("No feedback matches your search."));
  assert.ok(!noMatch.includes("No feedback yet"));
});
