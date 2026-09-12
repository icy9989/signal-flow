import type { ImportStatus } from "@/generated/prisma/enums";

export function ImportStatusBadge({ status }: { status: ImportStatus }) {
  const label = { COMPLETED: "Complete", FAILED: "Failed", PROCESSING: "Processing", PENDING: "Pending" }[status];
  const color = status === "COMPLETED" ? "border-primary-border bg-primary-soft text-primary" : status === "FAILED" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-warning/30 bg-warning/10 text-warning";
  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${color}`}>{label}</span>;
}
