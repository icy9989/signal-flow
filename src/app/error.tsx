"use client";

import { Button } from "@/components/ui/button";

export default function ApplicationError({ retry }: { retry: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">We couldn’t open SignalFlow</h1>
      <p className="text-sm text-muted-foreground">
        Your account could not be loaded. Please try again in a moment.
      </p>
      <Button onClick={() => retry()}>Try again</Button>
    </main>
  );
}
