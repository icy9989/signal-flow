import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
  { variants: { variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary-hover",
    outline: "border border-border bg-surface hover:bg-hover",
    ghost: "hover:bg-hover",
  }, size: { default: "h-9 px-4", icon: "size-9" } },
  defaultVariants: { variant: "default", size: "default" } },
);

export function Button({ className, variant, size, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
