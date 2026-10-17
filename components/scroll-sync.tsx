"use client";

import { ScrollTrigger } from "@/lib/gsap";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

/*
  Native scrolling. ScrollTrigger only re-measures on window resize, so content
  that changes height (a collapsing panel, data arriving) would leave
  scroll-revealed rows and stamps mispositioned; re-measure on body resize.
  New routes start at the top.
*/
export function ScrollSync({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const lastPath = useRef(pathname);

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
    window.scrollTo(0, 0);
  }, [pathname]);

  return <>{children}</>;
}
