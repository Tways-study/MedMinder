"use client";

/*
  GSAP motion primitives. Rules shared by all of them:
  - everything runs inside gsap.matchMedia() under (prefers-reduced-motion:
    no-preference); under "reduce" nothing is hidden or moved and content is
    in its final state immediately;
  - only transform + opacity (autoAlpha) are animated, except ExpandCollapse
    which uses a CSS grid-template-rows transition;
  - initial hiding happens inside useGSAP (a layout effect), so a JS failure
    never leaves content at opacity 0.
*/

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { DUR, EASE, MOTION_OK, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

/* -------------------------------------------------------------------- Stagger */

/**
  Staggers its DIRECT children that carry `data-stagger` (mark them, e.g.
  `<li data-stagger>`).

  Props:
  - `scroll`: for long lists. Children start hidden and are revealed in
    batches by ScrollTrigger.batch as they enter the viewport (once).
  - `delay`: seconds before the first mount stagger (ignored for later appends).
  - `selector`: override the child selector (default "[data-stagger]"; always
    matched as direct children).

  Children appended later (load more, data arriving after a skeleton) are
  detected with a MutationObserver and animate in as their own staggered
  batch, so no `watch` prop is needed. Already-animated nodes never replay.
*/
export function Stagger({
  children,
  className,
  scroll = false,
  delay = 0,
  selector = "[data-stagger]",
}: {
  children: ReactNode;
  className?: string;
  scroll?: boolean;
  delay?: number;
  selector?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const seen = new WeakSet<Element>();
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const direct = () =>
          Array.from(root.children).filter((c) => c.matches(selector));

        const reveal = (els: Element[], extraDelay: number) => {
          if (!els.length) return;
          gsap.fromTo(
            els,
            { y: 10, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: DUR.enter,
              ease: EASE.out,
              stagger: STAGGER,
              delay: extraDelay,
              overwrite: "auto",
              clearProps: "transform,opacity,visibility",
            },
          );
        };

        const handle = (els: Element[], extraDelay: number) => {
          const fresh = els.filter((e) => !seen.has(e));
          fresh.forEach((e) => seen.add(e));
          if (!fresh.length) return;
          if (scroll) {
            gsap.set(fresh, { y: 10, autoAlpha: 0 });
            ScrollTrigger.batch(fresh, {
              start: "top 96%",
              once: true,
              onEnter: (batch) => reveal(batch, 0),
              onLeave: (batch) => reveal(batch, 0),
            });
            ScrollTrigger.refresh();
          } else {
            reveal(fresh, extraDelay);
          }
        };

        handle(direct(), delay);

        const observer = new MutationObserver(() => handle(direct(), 0));
        observer.observe(root, { childList: true });
        return () => observer.disconnect();
      });

      return () => mm.revert();
    },
    { scope: ref, dependencies: [scroll, selector] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------- ExpandCollapse */

/**
  Height-free expand/collapse: a grid-template-rows 0fr <-> 1fr CSS transition
  (interruptible; motion-reduce:transition-none). Children mount on open and
  unmount once the collapse finishes; while closed the region is `inert` +
  aria-hidden so it can't take focus. `show` is the legacy alias of `open`.
*/
export function ExpandCollapse({
  open,
  show,
  children,
  className,
}: {
  open?: boolean;
  /** Alias of `open` (legacy call sites). */
  show?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const isOpen = open ?? show ?? false;
  const [mounted, setMounted] = useState(isOpen);
  if (isOpen && !mounted) setMounted(true);

  // Unmount once the collapse has finished so uncontrolled children (forms)
  // reset instead of resurfacing stale input on the next open.
  useEffect(() => {
    if (isOpen) return;
    const t = setTimeout(() => setMounted(false), 320);
    return () => clearTimeout(t);
  }, [isOpen]);

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className,
      )}
      inert={!isOpen}
      aria-hidden={!isOpen}
    >
      <div className="min-h-0 overflow-hidden">{mounted ? children : null}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ useStampIn */

/**
  The stamp "thunk": from scale 1.6 / +8deg / hidden to its resting rotation
  (read from the element's own CSS transform) with EASE.stamp, plus a 2px shake
  of the nearest `[data-stamp-card]` ancestor at impact. Fires once, when the
  element enters the viewport. Under reduced motion the stamp just sits there.
  Options: `delay` (seconds, for sequencing after rows land), `enabled`.
*/
export function useStampIn(
  ref: RefObject<HTMLElement | null>,
  { delay = 0, enabled = true }: { delay?: number; enabled?: boolean } = {},
) {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !enabled) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const rot = Number(gsap.getProperty(el, "rotation")) || 0;
        const card = el.closest("[data-stamp-card]");
        gsap.set(el, { autoAlpha: 0, scale: 1.6, rotation: rot + 8 });
        let played = false;
        const play = () => {
          if (played) return;
          played = true;
          const tl = gsap.timeline({ delay });
          tl.to(el, {
            autoAlpha: 1,
            scale: 1,
            rotation: rot,
            duration: DUR.base,
            ease: EASE.stamp,
          });
          if (card) {
            tl.fromTo(
              card,
              { x: 0 },
              {
                keyframes: { x: [2, -2, 1, 0] },
                duration: DUR.micro + 0.04,
                ease: "none",
                clearProps: "transform",
              },
              DUR.base * 0.55,
            );
          }
        };
        // onLeave covers a stamp that is already above the viewport (restored
        // scroll position) so a status stamp can never stay hidden.
        const st = ScrollTrigger.create({
          trigger: el,
          start: "top 98%",
          once: true,
          onEnter: play,
          onLeave: play,
        });
        if (st.progress > 0) play();
        return () => st.kill();
      });
      return () => mm.revert();
    },
    { dependencies: [enabled, delay], revertOnUpdate: true },
  );
}

/* ------------------------------------------------------------ usePressFeedback */

/** Spread onto a pressable element for a 0.97 press scale. Skipped under reduced motion. */
export function usePressFeedback() {
  const to = (e: PointerEvent<HTMLElement>, scale: number) => {
    if (!window.matchMedia(MOTION_OK).matches) return;
    gsap.to(e.currentTarget, {
      scale,
      duration: DUR.micro,
      ease: EASE.out,
      overwrite: "auto",
    });
  };
  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => to(e, 0.97),
    onPointerUp: (e: PointerEvent<HTMLElement>) => to(e, 1),
    onPointerLeave: (e: PointerEvent<HTMLElement>) => to(e, 1),
  };
}

/* ----------------------------------------------------------------- useAlertIn */

/**
  An error or confirmation message arriving: a 6px drop and fade, so the eye
  is pulled to the new text instead of missing it. Runs each time `active`
  turns true. Under reduced motion the message simply appears.
*/
export function useAlertIn(ref: RefObject<HTMLElement | null>, active: boolean) {
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !active) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          el,
          { y: -6, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: DUR.base,
            ease: EASE.out,
            clearProps: "transform,opacity,visibility",
          },
        );
      });
      return () => mm.revert();
    },
    { dependencies: [active], revertOnUpdate: true },
  );
}

