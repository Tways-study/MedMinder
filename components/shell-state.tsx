"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "medminder.sidebar-collapsed";

type ShellState = {
  /** Desktop sidebar is the 56px icon rail. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
};

const ShellContext = createContext<ShellState | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  // Starts expanded so server and client agree; a saved preference applies
  // right after mount. Storage can be blocked, so every access is guarded.
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ collapsed, toggleCollapsed, paletteOpen, setPaletteOpen }),
    [collapsed, toggleCollapsed, paletteOpen],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <ShellProvider>");
  return ctx;
}
