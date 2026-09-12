export default function WorkspaceLoading() {
  return <div role="status" aria-label="Loading workspace" className="space-y-6 motion-safe:animate-pulse">
    <span className="sr-only">Loading workspace…</span>
    <div className="h-4 w-48 rounded bg-elevated" /><div className="h-9 w-64 rounded bg-elevated" />
    <div className="rounded-xl border border-border bg-surface p-8"><div className="mx-auto h-12 w-12 rounded-lg bg-elevated" /><div className="mx-auto mt-6 h-6 w-48 rounded bg-elevated" /><div className="mx-auto mt-4 h-4 w-full max-w-sm rounded bg-elevated" /><div className="mx-auto mt-8 h-10 w-40 rounded bg-elevated" /></div>
  </div>;
}
