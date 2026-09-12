import { z } from "zod";

export const classificationLimits = {
  topics: 5, topicLength: 80, summaryLength: 400, sourceLength: 20_000,
} as const;
export const sentimentSchema = z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]);
export const categorySchema = z.enum([
  "BUG", "FEATURE_REQUEST", "USABILITY", "PERFORMANCE", "PRICING",
  "SUPPORT", "POSITIVE_FEEDBACK", "OTHER",
]);
export const severitySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

// Separate transport bounds from the normalized contract; malformed types and
// enum values are never coerced into valid classification data.
export const rawClassificationSchema = z.strictObject({
  sentiment: sentimentSchema, category: categorySchema, severity: severitySchema,
  topics: z.array(z.string().max(200)).max(20),
  summary: z.string().max(2_000),
});
export const feedbackClassificationSchema = z.strictObject({
  sentiment: sentimentSchema, category: categorySchema, severity: severitySchema,
  topics: z.array(z.string().min(1).max(classificationLimits.topicLength)
    .refine(value => value === value.trim().toLowerCase(), "Topics must be normalized."))
    .min(1).max(classificationLimits.topics)
    .refine(value => new Set(value).size === value.length, "Topics must be unique."),
  summary: z.string().min(1).max(classificationLimits.summaryLength)
    .refine(value => value === value.trim(), "Summary must be trimmed."),
});
export type FeedbackClassification = z.infer<typeof feedbackClassificationSchema>;
