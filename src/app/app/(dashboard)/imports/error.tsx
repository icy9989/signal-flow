"use client";
import { Button } from "@/components/ui/button";
export default function ImportsError({ reset }: { reset: () => void }) {
  return <section role="alert" className="space-y-4 rounded-xl border border-border bg-surface p-6"><h1 className="text-lg font-semibold">We couldn&apos;t load import history.</h1><p className="text-sm text-secondary">Please try again to load your imports and their results.</p><Button onClick={reset}>Try again</Button></section>;
}
