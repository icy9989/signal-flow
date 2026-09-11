"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createProjectAction } from "@/app/app/project-actions";
import { Button } from "@/components/ui/button";

export function CreateProjectForm() {
  const [state, action, pending] = useActionState(createProjectAction, {});
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const id = useId();
  return <form action={action} className="space-y-6" aria-busy={pending}>
    <div>
      <label htmlFor={`${id}-name`} className="mb-2 block text-sm font-medium">Project name</label>
      <input id={`${id}-name`} name="name" required value={name} onChange={event => setName(event.target.value)} placeholder="Mobile App" disabled={pending} aria-invalid={state.error?.field === "name" || undefined} aria-describedby={state.error ? `${id}-error` : undefined} className="h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm placeholder:text-muted disabled:opacity-60" />
    </div>
    <div>
      <label htmlFor={`${id}-description`} className="mb-2 block text-sm font-medium">Description <span className="font-normal text-secondary">(optional)</span></label>
      <textarea id={`${id}-description`} name="description" rows={4} value={description} onChange={event => setDescription(event.target.value)} placeholder="Customer feedback for our mobile product." disabled={pending} aria-invalid={state.error?.field === "description" || undefined} aria-describedby={state.error ? `${id}-error` : undefined} className="w-full resize-y rounded-md border border-border bg-elevated px-3 py-3 text-sm placeholder:text-muted disabled:opacity-60" />
      <p className="mt-2 text-xs text-secondary">A little context helps your team find the right project.</p>
    </div>
    {state.error && <p id={`${id}-error`} role="alert" className="rounded-md border border-[var(--state-error)]/30 bg-[var(--state-error)]/10 px-3 py-2 text-sm">{state.error.message}</p>}
    <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
      {pending ? <span className="px-4 text-sm text-muted">Cancel</span> : <Link href="/app/projects" className="rounded-md px-4 py-2 text-sm text-secondary hover:bg-hover">Cancel</Link>}
      <Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}{pending ? "Creating project…" : "Create project"}</Button>
    </div>
  </form>;
}
