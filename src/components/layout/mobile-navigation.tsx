"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Navigation } from "@/components/layout/navigation";
import { WorkspaceSwitcher } from "@/components/organization/workspace-switcher";
import { usePathname } from "next/navigation";

export function MobileNavigation({ workspaces, activeId }: { workspaces: { id: string; name: string }[]; activeId?: string }) {
  const pathname = usePathname();
  return <Sheet key={`${pathname}:${activeId}`}>
    <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Open navigation" className="lg:hidden"><Menu /></Button></SheetTrigger>
    <SheetContent>
      <SheetTitle className="mb-2 text-lg font-semibold">SignalFlow</SheetTitle>
      <SheetDescription className="mb-6 text-xs text-secondary">Your feedback workspace</SheetDescription>
      <WorkspaceSwitcher workspaces={workspaces} activeId={activeId} />
      <Navigation />
    </SheetContent>
  </Sheet>;
}
