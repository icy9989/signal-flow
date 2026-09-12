import type { classificationMessages } from "../prompts/feedback-classification";

export interface ClassificationProvider {
  /** Provider-qualified, exact model name used for reuse/version decisions. */
  model: string;
  generate(messages: ReturnType<typeof classificationMessages>): Promise<unknown>;
}
