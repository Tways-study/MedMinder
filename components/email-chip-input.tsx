"use client";

import * as React from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function EmailChipInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (emails: string[]) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function addEmail(raw: string) {
    const email = raw.trim();
    if (!email) return;
    if (!isValidEmail(email)) {
      setError("That doesn't look like an email address.");
      return;
    }
    if (value.includes(email)) {
      setError("Already added.");
      return;
    }
    setError(null);
    onChange([...value, email]);
    setDraft("");
  }

  function removeEmail(email: string) {
    onChange(value.filter((e) => e !== email));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      removeEmail(value[value.length - 1]);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          "flex min-h-11 flex-wrap items-center gap-1.5 rounded-sm border border-input bg-background px-3 py-2 cursor-text",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring",
          error && "border-destructive",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((email) => (
          <span
            key={email}
            className="flex items-center gap-1 rounded-sm bg-secondary px-2 py-0.5 text-sm font-medium text-secondary-foreground"
          >
            {email}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeEmail(email);
              }}
              aria-label={`Remove ${email}`}
              className="ml-0.5 rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Cross2Icon className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="email"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft) addEmail(draft);
          }}
          placeholder={value.length === 0 ? "Add email address…" : ""}
          className="min-w-[12rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
