"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, Inbox, LayoutDashboard, Lightbulb, Plug, Settings, Tags, Upload, Users } from "lucide-react";

const navigation = [
  { label: "Overview", icon: LayoutDashboard, href: "/app/overview" },
  { label: "Feedback", icon: Inbox },
  { label: "Topics", icon: Tags },
  { label: "Insights", icon: Lightbulb },
  { label: "Analytics", icon: BarChart3 },
  { label: "Imports", icon: Upload },
  { label: "Integrations", icon: Plug },
  { label: "Team", icon: Users },
  { label: "Billing", icon: CreditCard },
  { label: "Settings", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  return <nav aria-label="Main navigation" className="space-y-1">
    {navigation.map(({ label, icon: Icon, ...item }, index) => <div key={label} className={index === 6 ? "mt-6 border-t border-border pt-5" : undefined}>
      {item.href ? <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined} className="flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-sm font-medium text-secondary hover:bg-hover aria-[current=page]:border-primary-border aria-[current=page]:bg-primary-soft aria-[current=page]:text-foreground">
        <Icon aria-hidden="true" className={`size-4 ${pathname === item.href ? "text-primary" : "text-secondary"}`} />{label}
      </Link> : <button disabled title={`${label} is not available yet`} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-secondary opacity-60">
        <Icon aria-hidden="true" className="size-4" />{label}
      </button>}
    </div>)}
  </nav>;
}
