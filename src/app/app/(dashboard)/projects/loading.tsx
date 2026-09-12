export default function ProjectsLoading() {
  return <div role="status" aria-label="Loading projects" className="space-y-6 motion-safe:animate-pulse">
    <span className="sr-only">Loading projects…</span>
    <div className="h-8 w-48 rounded bg-elevated" />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(key => <div key={key} className="h-64 rounded-xl border border-border bg-surface" />)}</div>
  </div>;
}
