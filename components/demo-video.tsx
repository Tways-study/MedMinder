"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Play } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const SEEN_KEY = "medminder:demo-seen";

/**
 * The demo film on the sign-in page. It opens by itself the first time the
 * page loads in a browser session, and from the "Watch the demo" button any
 * time after. Radix unmounts the content on close, so the video stops with the
 * dialog.
 *
 * Browsers only allow sound after a user gesture, so an automatic open tries
 * sound first and falls back to muted (the player's controls unmute it). It is
 * skipped under reduced motion.
 */
export function DemoVideo() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (window.sessionStorage.getItem(SEEN_KEY)) return;
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Storage can be blocked; fall through and open once for this load.
    }
    setOpen(true);
  }, []);

  const play = useCallback((video: HTMLVideoElement | null) => {
    if (!video) return;
    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-below
          className="group flex w-fit items-center gap-3 rounded-md border border-primary-foreground/30 px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
        >
          <Play className="size-4" strokeWidth={1.75} aria-hidden />
          Watch the demo
          <span className="font-data text-xs text-landing-ink">0:32</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden border-0 bg-black p-0 text-white">
        <DialogTitle className="sr-only">MedMinder demo</DialogTitle>
        <DialogDescription className="sr-only">
          A 32 second film: counting a shelf is not the same as checking its
          dates, and MedMinder stamps every lot by how close it is to expiring.
        </DialogDescription>
        <video
          ref={play}
          className="aspect-video w-full"
          src="/demo/medminder-demo.mp4"
          poster="/demo/medminder-demo-poster.jpg"
          controls
          playsInline
          preload="auto"
        />
      </DialogContent>
    </Dialog>
  );
}
