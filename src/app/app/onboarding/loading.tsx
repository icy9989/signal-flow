export default function OnboardingLoading() {
  return <div role="status" aria-label="Loading your setup" className="motion-safe:animate-pulse">
    <span className="sr-only">Loading your setup…</span>
    <div aria-hidden="true" className="mb-8 h-8 rounded-lg bg-elevated" />
    <div aria-hidden="true" className="space-y-6 rounded-xl border border-border bg-surface p-8">
      <div className="h-7 w-2/3 rounded bg-elevated" /><div className="h-12 rounded bg-elevated" /><div className="h-11 rounded bg-elevated" /><div className="ml-auto h-11 w-40 rounded bg-elevated" />
    </div>
  </div>;
}
