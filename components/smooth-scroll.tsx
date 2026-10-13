"use client";

import { gsap, ScrollTrigger } from "@/lib/gsap";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

/*
  Lenis smooth scrolling, driven by gsap.ticker so ScrollTrigger and Lenis
  share one clock. Off entirely under prefers-reduced-motion (and re-evaluated
  if the preference flips). Touch keeps native scrolling. Internally scrolling
  overlays opt out with `data-lenis-prevent`.
*/
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const lastPath = useRef(pathname);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let teardown: (() => void) | undefined;

    const start = () => {
      const lenis = new Lenis({ autoRaf: false });
      lenisRef.current = lenis;
      const onScroll = () => ScrollTrigger.update();
      lenis.on("scroll", onScroll);
      const tick = (t: number) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      return () => {
        gsap.ticker.remove(tick);
        lenis.off("scroll", onScroll);
        lenis.destroy();
        lenisRef.current = null;
        gsap.ticker.lagSmoothing(500, 33);
      };
    };

    const sync = () => {
      teardown?.();
      teardown = mq.matches ? undefined : start();
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      teardown?.();
    };
  }, []);

  // ScrollTrigger only re-measures on window resize. Content that changes
  // height (a collapsing panel, data arriving) shifts trigger positions, which
  // would leave scroll-revealed rows/stamps hidden; re-measure on body resize.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => ScrollTrigger.refresh(), 120);
    });
    ro.observe(document.body);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname]);

  return <>{children}</>;
}
