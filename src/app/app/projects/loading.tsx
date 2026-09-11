export default function ProjectsLoading() {
  return <div role="status" aria-label="Loading projects" className="space-y-6"><div className="h-9 w-40 animate-pulse rounded-md bg-elevated" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(index => <div key={index} className="h-64 animate-pulse rounded-xl border border-border bg-surface" />)}</div><span className="sr-only">Loading projects…</span></div>;
}
