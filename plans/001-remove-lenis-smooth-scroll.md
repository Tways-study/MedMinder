# 001 — Remove Lenis smooth scroll, keep native scroll

- **Status**: DONE
- **Commit**: 1690b07
- **Severity**: HIGH
- **Category**: motion
- **Estimated scope**: 3 files edited, 1 deleted, 1 dependency removed

## Problem

Inertial scroll wraps the entire app. MedMinder is a task-focused staff tool used hundreds of times a day; wheel inertia adds lag to every scroll and gives nothing back.

```tsx
/* components/ConvexClientProvider.tsx:20 — current */
<SmoothScroll>{children}</SmoothScroll>
```

```tsx
/* components/smooth-scroll.tsx:25 — current */
const lenis = new Lenis({ autoRaf: false });
```

The same file also does two jobs that must survive: it re-measures ScrollTrigger when the body resizes (`:56-67`, `ScrollTrigger.refresh()` after 120ms) and scrolls to the top on route change (`:69-74`). Row stagger and the stamp thunk depend on ScrollTrigger measuring correctly.

## Target

- No Lenis, no inertia, no `lenis/dist/lenis.css`, no `lenis` dependency.
- A new `components/scroll-sync.tsx` keeps only: the body `ResizeObserver` → `ScrollTrigger.refresh()` (120ms debounce), and `window.scrollTo(0, 0)` on pathname change.
- Behaviour on every other page is identical to native scrolling.

## Repo conventions to follow

- GSAP and ScrollTrigger are imported from `@/lib/gsap` (see `smooth-scroll.tsx:3`).
- Client components start with `"use client";`.

## Steps

1. Create `components/scroll-sync.tsx`:

```tsx
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
```

2. `components/ConvexClientProvider.tsx`: replace `import { SmoothScroll } from "@/components/smooth-scroll";` with `import { ScrollSync } from "@/components/scroll-sync";` and `<SmoothScroll>{children}</SmoothScroll>` with `<ScrollSync>{children}</ScrollSync>`.
3. Delete `components/smooth-scroll.tsx`.
4. Remove every `data-lenis-prevent` attribute: `grep -rn "data-lenis-prevent" app components`. Delete only the attribute, nothing else on those lines.
5. `npm uninstall lenis`.

## Boundaries

- Do NOT touch `lib/gsap.ts`, `motion.tsx`, or any ScrollTrigger usage.
- Do NOT add new dependencies.
- Do NOT change markup beyond removing the `data-lenis-prevent` attribute.
- If a step doesn't match the code you find, STOP and report.

## Verification

- **Mechanical**: `npm run lint`, then `npm run build` — both pass; `grep -rni lenis app components lib package.json` returns nothing.
- **Feel check**: run the app, scroll Medicines with the wheel.
  - Scrolling stops when the wheel stops (no glide).
  - Scrolling inside the table container, dialogs, selects and popovers works normally.
  - Navigating between routes lands at the top.
  - With `prefers-reduced-motion` on, nothing changes.
- **Done when**: no Lenis references remain and scrolling is native everywhere.
