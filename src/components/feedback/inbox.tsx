import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, Inbox, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inboxHref, type InboxQuery } from "@/features/feedback/query";
import type { createFeedbackInboxService } from "@/server/services/feedback-inbox-service";

type InboxResult = Awaited<ReturnType<ReturnType<typeof createFeedbackInboxService>["list"]>>;
const control = "mt-1 h-9 w-full min-w-0 rounded-md border border-border bg-elevated px-3 text-sm";
export const feedbackLinkClass = "inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-hover";
export function feedbackDate(date: Date | null, detail = false) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: detail ? "long" : "short", day: "numeric", timeZone: "UTC", ...(detail ? { hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short" } as const : {}) }).format(date);
}
export function InboxHeader({ projectName, canImport }: { projectName: string; canImport: boolean }) {
  return <header className="flex flex-wrap items-start justify-between gap-4">
    <div><h1 className="text-2xl font-semibold">Feedback</h1><p className="mt-2 break-words text-sm text-secondary">Original customer feedback in {projectName}</p></div>
    <div className="flex flex-wrap gap-2"><Link className={feedbackLinkClass} href="/app/imports">Import history</Link>{canImport && <Link className="inline-flex min-h-9 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover" href="/app/imports/new"><Upload className="size-4" />Import feedback</Link>}</div>
  </header>;
}
function FeedbackFilters({ query, sources, imports }: Pick<InboxResult, "query" | "sources" | "imports">) {
  return <form action="/app/feedback" method="get" key={inboxHref(query)} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-6" role="search" aria-label="Search and filter feedback">
    <label className="min-w-0 text-xs text-secondary sm:col-span-2 xl:col-span-2">Search feedback<input className={control} type="search" name="q" defaultValue={query.q} maxLength={500} placeholder="Search content, external ID or customer" /></label>
    <label className="min-w-0 text-xs text-secondary">Source<select className={control} name="source" defaultValue={query.source}><option value="">All sources</option>{query.source && !sources.some(row => row.source === query.source) && <option value={query.source}>{query.source}</option>}{sources.filter(row => row.source).map(row => <option key={row.source} value={row.source}>{row.source}</option>)}</select></label>
    <label className="min-w-0 text-xs text-secondary">Import<select className={control} name="importId" defaultValue={query.importId}><option value="">All imports</option>{imports.map(row => <option key={row.id} value={row.id}>{row.fileName ?? row.id}</option>)}</select></label>
    <label className="min-w-0 text-xs text-secondary">Occurred from (UTC)<input className={control} type="date" name="from" defaultValue={query.from} max={query.to || undefined} /></label>
    <label className="min-w-0 text-xs text-secondary">Occurred through (UTC)<input className={control} type="date" name="to" defaultValue={query.to} min={query.from || undefined} /></label>
    <div className="flex gap-2 sm:col-span-2 xl:col-span-6"><Button type="submit">Apply filters</Button>{Object.entries(query).some(([key, value]) => key !== "cursor" && value) && <Link className={feedbackLinkClass} href="/app/feedback">Clear filters</Link>}</div>
  </form>;
}
export function FeedbackInbox({ result, canImport }: { result: InboxResult; canImport: boolean }) {
  const { items, query, total, projectTotal, nextCursor, previousCursor } = result;
  return <>
    <FeedbackFilters {...result} />
    <div className="flex flex-wrap justify-between gap-2 text-xs text-secondary"><p role="status">{total.toLocaleString("en-US")} matching feedback {total === 1 ? "item" : "items"} · Showing {items.length}</p><p className="flex items-center gap-1"><ArrowDown className="size-3" />Newest imported first · Dates in UTC</p></div>
    {items.length ? <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface" aria-label="Feedback">
      {items.map(row => <li key={row.id}><Link href={`/app/feedback/${encodeURIComponent(row.id)}${inboxHref(query).replace("/app/feedback", "")}`} className="block space-y-3 p-4 transition-colors hover:bg-hover">
        <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6">{row.content}</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-secondary md:grid-cols-4">
          {[["Source", row.source || "—"], ["Customer", row.customerReference ?? "—"], ["Occurred", feedbackDate(row.occurredAt)], ["Imported", feedbackDate(row.createdAt)]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-muted">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>)}
        </dl><span className="sr-only">Open full feedback</span>
      </Link></li>)}
    </ul> : <section className="space-y-3 rounded-xl border border-border bg-surface p-8"><Inbox className="size-7 text-secondary" /><h2 className="font-semibold">{projectTotal ? "No feedback matches your search." : "No feedback yet"}</h2><p className="text-sm text-secondary">{projectTotal ? "Try a different keyword or clear your filters." : canImport ? "Import a CSV to start building your feedback inbox." : "Ask a workspace owner or admin to import a CSV to start building your feedback inbox."}</p>{projectTotal || query.cursor ? <Link className={feedbackLinkClass} href="/app/feedback">Clear filters</Link> : canImport && <Link className={feedbackLinkClass} href="/app/imports/new">Import feedback</Link>}</section>}
    <nav aria-label="Feedback pagination" className="flex justify-between gap-3">
      {previousCursor ? <Link className={feedbackLinkClass} href={inboxHref(query, previousCursor)}><ArrowLeft className="size-4" />Previous</Link> : <Button variant="outline" disabled>Previous</Button>}
      {nextCursor ? <Link className={feedbackLinkClass} href={inboxHref(query, nextCursor)}>Next<ArrowRight className="size-4" /></Link> : <Button variant="outline" disabled>Next</Button>}
    </nav>
  </>;
}
export function InvalidInboxQuery({ message }: { message: string }) {
  return <section role="alert" className="space-y-4 rounded-xl border border-border bg-surface p-6"><h2 className="font-semibold">Check your filters</h2><p className="text-sm text-secondary">{message}</p><Link href="/app/feedback" className={feedbackLinkClass}>Clear filters</Link></section>;
}
export function FeedbackBackLink({ query }: { query: InboxQuery }) {
  return <Link href={inboxHref(query)} className={feedbackLinkClass}><ArrowLeft className="size-4" />Back to feedback</Link>;
}
