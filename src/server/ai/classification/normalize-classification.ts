import { feedbackClassificationSchema, rawClassificationSchema, classificationLimits } from "../schemas/feedback-classification-schema";

export function normalizeClassification(output: unknown, source: string) {
  const parsed = rawClassificationSchema.parse(output);
  const topics = [...new Set(parsed.topics.map(topic => topic.trim().toLowerCase()).filter(Boolean))];
  const result = feedbackClassificationSchema.parse({
    ...parsed, topics: topics.slice(0, classificationLimits.topics), summary: parsed.summary.trim(),
  });
  if (source.trim().length > 200 && result.summary === source.trim()) {
    throw new Error("Summary must condense long source feedback.");
  }
  return result;
}
