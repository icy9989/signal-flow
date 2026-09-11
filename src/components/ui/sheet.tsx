"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;

export function SheetContent({ children, className, ...props }: React.ComponentProps<typeof Dialog.Content>) {
  return <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-40 bg-background/80" />
    <Dialog.Content className={cn("fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto border-r border-border bg-sidebar p-5 shadow-xl", className)} {...props}>
      {children}
      <Dialog.Close className="absolute right-4 top-4 rounded-md p-2 text-secondary hover:bg-hover">
        <X className="size-4" /><span className="sr-only">Close navigation</span>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>;
}
