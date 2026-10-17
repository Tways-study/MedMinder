"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTitle = DialogPrimitive.Title;
const SheetDescription = DialogPrimitive.Description;

/*
  A right-hand panel built on Radix Dialog. `modal={false}` (the desktop
  master-detail case) drops the focus trap and outside-click scrim so the list
  beside it stays usable; the overlay is only rendered when `modal` is true.
  Slides in at the default 150ms: it opens tens of times a day, so it stays quick.
*/
const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    modal?: boolean;
    /** Desktop: sit below the 56px top bar instead of covering it. */
    belowTopBar?: boolean;
  }
>(({ className, children, modal = true, belowTopBar = false, ...props }, ref) => (
  <DialogPrimitive.Portal>
    {modal && (
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:duration-150 data-[state=closed]:duration-100" />
    )}
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed bottom-0 right-0 z-50 flex w-full flex-col border-l bg-card text-card-foreground shadow-lg outline-none sm:max-w-[28rem]",
        belowTopBar ? "top-0 md:top-14" : "top-0",
        "data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-3 top-3 grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <X className="size-4" strokeWidth={1.75} aria-hidden />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";

export { Sheet, SheetContent, SheetDescription, SheetTitle };
