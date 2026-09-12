"use client";

import { Button } from "@/components/ui/button";

export default function ProjectsError({ retry }: { retry: () => void }) {
  return <section className="space-y-4 rounded-xl border border-border bg-surface p-8">
    <h1 className="text-xl font-semibold">We couldn’t load your projects</h1>
    <p className="text-sm text-secondary">Please try again in a moment.</p>
    <Button onClick={() => retry()}>Try again</Button>
  </section>;
}
