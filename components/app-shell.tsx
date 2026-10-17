"use client";

import { AppNav } from "@/components/app-nav";
import { CommandPalette } from "@/components/command-palette";
import { LogoMark } from "@/components/logo-mark";
import { ShellProvider, useShell } from "@/components/shell-state";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Authenticated } from "convex/react";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";

/** "⌘K" on Apple platforms, "Ctrl K" elsewhere. Neutral until mounted. */
function useShortcutLabel() {
  const [label, setLabel] = useState("Ctrl K");
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setLabel("⌘K");
  }, []);
  return label;
}

function SearchTrigger() {
  const { setPaletteOpen } = useShell();
  const shortcut = useShortcutLabel();
  return (
    <button
      type="button"
      onClick={() => setPaletteOpen(true)}
      className="focus-card flex h-9 w-full max-w-md items-center gap-2 rounded-md border border-input bg-card px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted"
    >
      <Search className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span className="flex-1 truncate">Search medicines or jump to…</span>
      <kbd className="font-data rounded-sm border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
        {shortcut}
      </kbd>
    </button>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const { collapsed, setPaletteOpen } = useShell();

  return (
    <div
      className={cn(
        "min-h-[100dvh] transition-[padding] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
        collapsed ? "md:pl-14" : "md:pl-60",
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Phone top bar: brand, search and account. */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/95 px-4 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur md:hidden">
        <Link
          href="/"
          className="focus-card -ml-1 flex items-center gap-2 rounded-md px-1 py-1"
        >
          <LogoMark className="size-7" />
          <span className="font-serif text-2xl font-medium leading-none">
            MedMinder
          </span>
        </Link>
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Search"
            onClick={() => setPaletteOpen(true)}
          >
            <Search strokeWidth={1.75} aria-hidden />
          </Button>
          <UserMenu />
        </div>
      </header>

      {/* Desktop top bar: search / command palette and the primary action. */}
      <header className="sticky top-0 z-30 hidden h-14 items-center gap-3 border-b bg-background/95 px-6 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur md:flex lg:px-8">
        <SearchTrigger />
        <Button asChild className="ml-auto">
          <Link href="/medicines/new">
            <Plus strokeWidth={1.75} aria-hidden />
            Add medicine
          </Link>
        </Button>
      </header>

      {children}

      {/* The nav queries nothing, so it stays put outside the auth gate. */}
      <AppNav />

      {/* Searches the inventory, so it only exists for a signed-in account. */}
      <Authenticated>
        <CommandPalette />
      </Authenticated>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ShellProvider>
      <Frame>{children}</Frame>
    </ShellProvider>
  );
}
