"use client";
import { Button } from "@/components/ui/button";
export default function FeedbackError({ retry }: { retry: () => void }) {
  return <section role="alert" className="space-y-4 rounded-xl border border-border bg-surface p-6"><h1 className="text-lg font-semibold">We couldn&apos;t load feedback.</h1><p className="text-sm text-secondary">Please try again.</p><Button onClick={retry}>Try again</Button></section>;
}
