"use client";
import { Button } from "@/components/ui/button";
export default function ProjectsError({ reset }: { reset: () => void }) {
  return <div role="alert" className="rounded-xl border border-border bg-surface p-8"><h2 className="text-xl font-semibold">Projects couldn’t load</h2><p className="mt-2 text-sm text-secondary">Please try again to load your workspace projects.</p><Button onClick={reset} className="mt-5">Try again</Button></div>;
}
