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

import { Flip, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { DUR, EASE, MOTION_OK, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/* ---------------------------------------------------------------- FadeSlideIn */

/** Entry-only fade + 8px rise on mount. `delay` is in seconds. */
export function FadeSlideIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(ref.current, {
          y: 8,
          autoAlpha: 0,
          duration: DUR.base,
          delay,
          ease: EASE.out,
          clearProps: "transform,opacity,visibility",
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

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

/* ---------------------------------------------------------------- RollingNumber */

/**
  A count that tweens a proxy value (snap 1) and slides a few px in the
  direction of change (up = enters from below). Under reduced motion it shows
  the final value immediately. `countUpOnMount` counts 0 -> value on first
  mount only; later updates roll between values. Screen readers get the final
  value, never the intermediate frames.
*/
export function RollingNumber({
  value,
  format = String,
  className,
  countUpOnMount = false,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  countUpOnMount?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef({ v: value });
  const first = useRef(true);
  // Frames write straight to the text node (React renders it from `value`),
  // so the tween never re-renders the component.
  const write = (n: number) => {
    const node = ref.current?.firstElementChild?.firstChild;
    if (node) node.nodeValue = format(n);
  };

  useGSAP(
    () => {
      const isFirst = first.current;
      first.current = false;
      const from = isFirst ? (countUpOnMount ? 0 : value) : shown.current.v;
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        const proxy = shown.current;
        if (from === value) {
          proxy.v = value;
          write(value);
          return;
        }
        const dir = value >= from ? 1 : -1;
        proxy.v = from;
        write(from);
        const inner = ref.current?.firstElementChild;
        if (inner && !isFirst) {
          gsap.fromTo(
            inner,
            { y: dir * 10, autoAlpha: 0.2 },
            { y: 0, autoAlpha: 1, duration: DUR.base, ease: EASE.out },
          );
        }
        gsap.to(proxy, {
          v: value,
          duration: isFirst ? DUR.enter : DUR.base,
          ease: EASE.out,
          snap: { v: 1 },
          onUpdate: () => write(proxy.v),
        });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        shown.current.v = value;
        write(value);
      });

      return () => mm.revert();
    },
    { scope: ref, dependencies: [value], revertOnUpdate: true },
  );

  return (
    <span
      ref={ref}
      className={cn(
        "relative inline-flex overflow-hidden tabular-nums",
        className,
      )}
    >
      <span aria-hidden className="inline-block">
        {format(value)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </span>
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

/* ----------------------------------------------------------------- useFlipList */

/**
  Continuity for a list that reorders or filters: rows slide to their new place
  instead of snapping. Mark each row `data-flip-id={stableId}`.

  GSAP Flip needs the layout from *before* the change, so call the returned
  `capture()` right before the state setter that causes it, and pass a
  `signature` (the ordered ids) that changes when the list does:

    const capture = useFlipList(ids.join());
    onChange={(v) => { capture(); setSort(v); }}

  For changes that happen instantly on the client (sort, filter). A change that
  has to be fetched, like search, re-mounts its rows and gets their entrance
  instead. Rows that are new are left to their own entrance; removed rows are
  already gone from the DOM. Nothing is captured under reduced motion, so the
  list just updates.
*/
export function useFlipList(signature: string) {
  const pending = useRef<ReturnType<typeof Flip.getState> | null>(null);

  const capture = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia(MOTION_OK).matches) return;
    pending.current = Flip.getState("[data-flip-id]");
  }, []);

  useLayoutEffect(() => {
    const state = pending.current;
    if (!state) return;
    pending.current = null;
    Flip.from(state, {
      targets: "[data-flip-id]",
      duration: DUR.base,
      ease: EASE.out,
      overwrite: "auto",
    });
  }, [signature]);

  return capture;
}
