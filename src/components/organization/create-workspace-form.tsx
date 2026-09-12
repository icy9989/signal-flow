"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createWorkspaceAction } from "@/app/app/workspace-actions";
import { Button } from "@/components/ui/button";

export function CreateWorkspaceForm({ onboarding = false }: { onboarding?: boolean }) {
  const [state, action, pending] = useActionState(createWorkspaceAction, {});
  const [name, setName] = useState("");
  const id = useId();

  return <form action={action} className="space-y-6" aria-busy={pending}>
    {onboarding && <input type="hidden" name="flow" value="onboarding" />}
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">Workspace name</label>
        <span className="font-mono text-xs text-secondary">{name.length}/100</span>
      </div>
      <input id={id} name="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} autoComplete="organization" placeholder="Acme Inc." disabled={pending}
        aria-invalid={state.error?.field === "name" || undefined} aria-describedby={`${id}-hint${state.error ? ` ${id}-error` : ""}`}
        className="h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm placeholder:text-muted disabled:opacity-60" />
      <p id={`${id}-hint`} className="mt-2 text-xs leading-5 text-secondary">Use your company or team name. You can create more workspaces later.</p>
    </div>
    {state.error && <p id={`${id}-error`} role="alert" className="rounded-md border border-[var(--state-error)]/30 bg-[var(--state-error)]/10 px-3 py-2 text-sm text-foreground">{state.error.message}</p>}
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
      {!onboarding && (pending ? <span className="px-4 text-sm text-muted">Cancel</span> : <Link href="/app/overview" className="rounded-md px-4 py-2 text-sm text-secondary hover:bg-hover hover:text-foreground">Cancel</Link>)}
      <Button type="submit" disabled={pending} className="h-11 w-full sm:w-auto">{pending ? <LoaderCircle className="animate-spin" /> : null}{pending ? "Creating workspace…" : "Create workspace"}{!pending && <ArrowRight />}</Button>
    </div>
  </form>;
}
