"use client";
import { Button } from "@/components/ui/button";
export default function Error({ reset }: { reset: () => void }) {
  return <section className="space-y-4 rounded-xl border border-border bg-surface p-6"><h1 className="text-xl font-semibold">Import preview unavailable</h1><p role="alert" className="text-sm text-secondary">We couldn&apos;t load your project. Please try again.</p><Button onClick={reset}>Try again</Button></section>;
}
