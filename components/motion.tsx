"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useEffect, useRef } from "react";

/*
  One house spring: critically damped (no overshoot), ~0.35s response. Springs
  start from wherever the element is on screen, so an expand the person
  interrupts reverses smoothly instead of finishing first. Bounce is reserved
  for momentum gestures, and nothing here is flicked.
*/
export const SPRING = { type: "spring", bounce: 0, duration: 0.35 } as const;

/*
  Hover/press feedback wants to read as instant, not as an entrance: SPRING's
  0.35s response is tuned for things arriving on screen. This is about half
  that, critically damped, no bounce, so a tile answers the cursor before the
  user notices a delay.
*/
export const HOVER_SPRING = { type: "spring", bounce: 0, duration: 0.15 } as const;

/*
  Scale-only hover primitive for tile/row surfaces. Background/color feedback
  stays a plain Tailwind `hover:` class on the child — framer-motion can't
  animate a Tailwind utility directly, and a CSS pseudo-class is cheaper and
  matches how every other hover/press state in this app already works.
*/
export function HoverScale({
  children,
  className,
  scale = 1.02,
  tapScale,
}: {
  children: ReactNode;
  className?: string;
  scale?: number;
  /** Omit for non-clickable surfaces — a press animation implies an action. */
  tapScale?: number;
}) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={tapScale !== undefined ? { scale: tapScale } : undefined}
      transition={HOVER_SPRING}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeSlideIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  // Entry-only animation. Wrap with AnimatePresence if you need an exit.
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ExpandCollapse({
  show,
  children,
}: {
  show: boolean;
  children: ReactNode;
}) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={SPRING}
          style={{ overflow: "hidden" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/*
  A count that rolls in the direction it changed: up comes in from below, down
  from above. The motion answers the tap, so the person sees the shelf count
  move without re-reading the number. Under reduced motion MotionConfig drops
  the slide and only the cross-fade remains.
*/
export function RollingNumber({
  value,
  format = String,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const previous = useRef(value);
  const direction = value >= previous.current ? 1 : -1;
  useEffect(() => {
    previous.current = value;
  }, [value]);

  return (
    <span
      className={`relative inline-flex overflow-hidden tabular-nums ${className ?? ""}`}
    >
      <AnimatePresence initial={false} mode="popLayout" custom={direction}>
        <motion.span
          key={value}
          custom={direction}
          variants={{
            enter: (d: number) => ({ y: `${d * 70}%`, opacity: 0 }),
            center: { y: "0%", opacity: 1 },
            exit: (d: number) => ({ y: `${d * -70}%`, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SPRING}
          className="inline-block"
        >
          {format(value)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
