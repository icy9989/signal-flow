import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Activity } from "lucide-react";

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-background">
    <a href="#onboarding-content" className="sr-only fixed left-4 top-4 z-50 rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only">Skip to setup</a>
    <header className="flex h-16 items-center justify-between border-b border-border px-5 sm:px-8">
      <Link href="/app/onboarding" className="flex items-center gap-2 text-lg font-semibold tracking-tight"><Activity aria-hidden="true" className="size-6 text-primary" />SignalFlow</Link>
      <UserButton />
    </header>
    <main id="onboarding-content" tabIndex={-1} className="mx-auto w-full max-w-2xl px-5 py-10 outline-none sm:py-16">{children}</main>
  </div>;
}
