export type ClassificationErrorCode =
  | "AI_CONFIGURATION_ERROR" | "AI_FEEDBACK_NOT_FOUND" | "AI_FORBIDDEN"
  | "AI_INPUT_INVALID" | "AI_INPUT_TOO_LONG" | "AI_ALREADY_PROCESSING"
  | "AI_OUTPUT_VALIDATION_FAILED" | "AI_PROVIDER_TIMEOUT" | "AI_PROVIDER_RATE_LIMIT"
  | "AI_PROVIDER_NETWORK_ERROR" | "AI_PROVIDER_UNAVAILABLE" | "AI_PROVIDER_INVALID_RESPONSE"
  | "AI_PROVIDER_REJECTED" | "AI_PERSISTENCE_FAILED" | "AI_SOURCE_CHANGED";
export class ClassificationError extends Error {
  constructor(public readonly code: ClassificationErrorCode) {
    super(code === "AI_FEEDBACK_NOT_FOUND" ? "Feedback unavailable." : "SignalFlow couldn't classify this feedback yet.");
    this.name = "ClassificationError";
  }
}
