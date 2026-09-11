"use client";
import { useActionState } from "react";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { switchProjectAction } from "@/app/app/project-actions";
import { Button } from "@/components/ui/button";

export function SelectProjectButton({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(switchProjectAction, {});
  return <form action={action} aria-busy={pending}>
    <Button name="projectId" value={projectId} type="submit" variant="ghost" disabled={pending} className="w-full justify-between">{pending ? "Opening…" : "Open project"}{pending ? <LoaderCircle className="animate-spin" /> : <ArrowUpRight />}</Button>
    {state.error && <p role="alert" className="mt-2 text-xs text-secondary">{state.error.message}</p>}
  </form>;
}
