"use client";

import { Button } from "@/components/ui/button";

export default function OnboardingError({ reset }: { reset: () => void }) {
  return <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
    <h1 className="text-2xl font-semibold">We couldn’t load your setup</h1>
    <p role="alert" className="my-4 text-sm leading-6 text-secondary">Please try again. Your saved workspace and project will be used to resume your setup.</p>
    <Button onClick={reset} className="h-11">Try again</Button>
  </section>;
}
