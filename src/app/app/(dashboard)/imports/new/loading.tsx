export default function Loading() {
  return <div role="status" aria-label="Loading import preview" className="animate-pulse space-y-6 rounded-xl border border-border bg-surface p-6"><div className="h-8 w-48 rounded bg-elevated" /><div className="h-56 rounded-lg bg-elevated" /><span className="sr-only">Loading import preview…</span></div>;
}
