import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Activity, Bell, Search } from "lucide-react";
import { WorkspaceSwitcher } from "@/components/organization/workspace-switcher";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Navigation } from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";

type Workspace = { id: string; name: string };

export function ApplicationShell({ children, workspaces, activeWorkspace }: { children: React.ReactNode; workspaces: Workspace[]; activeWorkspace?: Workspace }) {
  return <div className="min-h-dvh">
    <a href="#main-content" className="sr-only fixed left-4 top-4 z-50 rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only">Skip to content</a>
    <aside className="fixed inset-y-0 left-0 hidden w-[248px] flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
      <Link href="/app/overview" className="mb-10 flex items-center gap-2.5 px-3 text-lg font-semibold tracking-tight"><Activity aria-hidden="true" className="size-6 text-primary" />SignalFlow</Link>
      <WorkspaceSwitcher key={activeWorkspace?.id ?? "onboarding"} workspaces={workspaces} activeId={activeWorkspace?.id} />
      <Navigation />
      <p className="mt-auto px-3 pt-8 text-xs leading-5 text-secondary">Customer feedback.<br />Clearer product decisions.</p>
    </aside>
    <div className="lg:pl-[248px]">
      <header className="flex h-16 items-center justify-between gap-3 border-b border-border px-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3"><MobileNavigation workspaces={workspaces} activeId={activeWorkspace?.id} /><span className="truncate text-sm text-secondary">{activeWorkspace?.name ?? "Workspace setup"}</span></div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="outline" disabled className="hidden text-secondary xl:inline-flex" title="Search will be available after feedback is imported"><Search />Search feedback…</Button>
          <Button variant="ghost" size="icon" disabled aria-label="Notifications unavailable"><Bell /></Button>
          <Show when="signed-out">
            <div className="flex items-center gap-2">
              <SignInButton mode="modal"><Button variant="ghost">Sign in</Button></SignInButton>
              <SignUpButton mode="modal"><Button>Sign up</Button></SignUpButton>
            </div>
          </Show>
          <Show when="signed-in"><UserButton /></Show>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1600px] p-6 outline-none sm:p-8">{children}</main>
    </div>
  </div>;
}
