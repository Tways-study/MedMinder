"use client";

import { useShell } from "@/components/shell-state";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { api } from "@/convex/_generated/api";
import { formatForm } from "@/lib/format";
import { statusStyle } from "@/components/status-chip";
import { INVENTORY_VIEWS, NAV_ITEMS } from "@/lib/nav";
import { useQuery } from "convex/react";
import { Pill, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const VIEW_LABEL = {
  all: "All",
  expired: "Expired",
  critical: "Critical",
  warning: "Soon",
  watch: "Watch",
  low: "Low stock",
} as const;

/*
  Keyboard-first: opens on Cmd/Ctrl+K, so it appears with no entrance motion
  (it is used hundreds of times a day). Filtering of the static destinations is
  done here, not by cmdk, because medicine results come from the server and
  arrive already ranked.
*/
export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useShell();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, setPaletteOpen]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 150);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!paletteOpen) {
      setQuery("");
      setDebounced("");
    }
  }, [paletteOpen]);

  const found = useQuery(
    api.medicines.searchByName,
    paletteOpen && debounced ? { q: debounced } : "skip",
  );
  // Keep the previous results on screen while the next query loads, so the
  // list doesn't blink empty between keystrokes.
  const lastFound = useRef(found);
  if (found !== undefined) lastFound.current = found;
  const medicines = debounced ? (found ?? lastFound.current ?? []) : [];

  const needle = query.trim().toLowerCase();
  const destinations = NAV_ITEMS.filter((i) =>
    i.label.toLowerCase().includes(needle),
  );
  const views = INVENTORY_VIEWS.filter((v) => v !== "all").filter((v) =>
    `show ${VIEW_LABEL[v]}`.toLowerCase().includes(needle),
  );
  const showAdd = "add medicine".includes(needle) || "new".includes(needle);

  const go = (href: string) => {
    setPaletteOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog
      open={paletteOpen}
      onOpenChange={setPaletteOpen}
      title="Search and navigate"
      description="Find a medicine, jump to a page, or add a medicine."
      contentClassName="top-[18%] max-w-xl translate-y-0 data-[state=open]:!animate-none data-[state=closed]:!animate-none"
      commandProps={{ shouldFilter: false, loop: true }}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search medicines or jump to…"
        className="text-base sm:text-sm"
      />
      <CommandList>
        <CommandEmpty>No matches for “{query.trim()}”.</CommandEmpty>

        {medicines.length > 0 && (
          <CommandGroup heading="Medicines">
            {medicines.map((m) => {
              const meta = [formatForm(m.form), m.strength]
                .filter(Boolean)
                .join(" · ");
              return (
                <CommandItem
                  key={m._id}
                  value={`medicine-${m._id}`}
                  onSelect={() => go(`/?m=${m._id}`)}
                >
                  <Pill aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{m.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {meta}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {medicines.length > 0 && (destinations.length > 0 || views.length > 0 || showAdd) && (
          <CommandSeparator />
        )}

        {(showAdd || !needle) && (
          <CommandGroup heading="Actions">
            <CommandItem value="action-add" onSelect={() => go("/?add=1")}>
              <Plus aria-hidden />
              Add medicine
            </CommandItem>
          </CommandGroup>
        )}

        {views.length > 0 && (
          <CommandGroup heading="Show">
            {views.map((v) => {
              const { icon: Icon, fg } = statusStyle(v === "low" ? "low" : v);
              return (
                <CommandItem
                  key={v}
                  value={`view-${v}`}
                  onSelect={() => go(`/?view=${v}`)}
                >
                  <Icon aria-hidden className={fg} />
                  {VIEW_LABEL[v]}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {destinations.length > 0 && (
          <CommandGroup heading="Go to">
            {destinations.map(({ href, label, icon: Icon }) => (
              <CommandItem
                key={href}
                value={`nav-${href}`}
                onSelect={() => go(href)}
              >
                <Icon aria-hidden />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
