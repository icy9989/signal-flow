import { Check } from "lucide-react";
import type { OnboardingStep } from "@/server/onboarding/resolve-onboarding-state";

const steps = ["WORKSPACE", "PROJECT", "FIRST_IMPORT"] as const;
const labels = ["Workspace", "Project", "Import"];

export function OnboardingProgress({ step }: { step: OnboardingStep }) {
  const current = step === "COMPLETE" ? steps.length : steps.indexOf(step);
  return <ol aria-label="Setup progress" className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    {steps.map((value, index) => <li key={value} aria-current={index === current ? "step" : undefined} className="flex items-center gap-3 text-sm">
      <span aria-hidden="true" className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${index <= current ? "border-primary-border bg-primary-soft text-primary" : "border-border text-secondary"}`}>
        {index < current ? <Check className="size-4" /> : index + 1}
      </span>
      <span className={index === current ? "font-medium text-foreground" : "text-secondary"}>{labels[index]}<span className="sr-only">{index < current ? ": complete" : index === current ? ": current step" : ": upcoming"}</span></span>
      {index < steps.length - 1 && <span aria-hidden="true" className="ml-3 hidden h-px w-8 bg-border sm:block" />}
    </li>)}
  </ol>;
}
