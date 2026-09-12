export default function ImportsLoading() {
  return <div role="status" aria-label="Loading imports" className="space-y-4"><div className="h-8 w-52 animate-pulse rounded bg-elevated" /><div className="rounded-xl border border-border bg-surface p-5">{Array.from({ length: 6 }, (_, index) => <div key={index} className="my-3 h-10 animate-pulse rounded bg-elevated" />)}</div></div>;
}
