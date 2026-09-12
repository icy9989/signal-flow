import assert from "node:assert/strict";
import { test } from "node:test";
import { feedbackClassificationSchema, categorySchema } from "../src/server/ai/schemas/feedback-classification-schema";
import { normalizeClassification } from "../src/server/ai/classification/normalize-classification";
const valid = { sentiment: "NEGATIVE", category: "BUG", severity: "HIGH", topics: ["login"], summary: "Login is broken." };

test("exact classification contract accepts all V1 categories and rejects malformed output", () => {
  for (const category of categorySchema.options) assert.ok(feedbackClassificationSchema.safeParse({ ...valid, category }).success);
  for (const invalid of [
    { sentiment: "MIXED" }, { category: "PRAISE" }, { severity: "URGENT" },
    { summary: undefined }, { topics: "login" }, { topics: [] }, { topics: [""] },
    { topics: ["login", "login"] }, { topics: ["Login"] }, { topics: Array(6).fill("a") },
    { summary: "a".repeat(401) }, { topics: ["a".repeat(81)] }, { organizationId: "forged" },
  ]) assert.equal(feedbackClassificationSchema.safeParse({ ...valid, ...invalid }).success, false);
});
test("normalization trims, lowercases, deduplicates, drops empty topics and bounds count", () => {
  const result = normalizeClassification({ ...valid, topics: [" Login ", "LOGIN", "  ", " Settings ", "A", "B", "C", "D"], summary: " Login is broken. " }, "Cannot log in.");
  assert.deepEqual(result.topics, ["login", "settings", "a", "b", "c"]);
  assert.equal(result.summary, valid.summary);
  for (const patch of [{ topics: [" "] }, { topics: ["x".repeat(81)] }, { summary: "x".repeat(401) }, { category: "invented" }]) {
    assert.throws(() => normalizeClassification({ ...valid, ...patch }, "source"));
  }
  const source = "x".repeat(201);
  assert.throws(() => normalizeClassification({ ...valid, summary: source }, source));
});
