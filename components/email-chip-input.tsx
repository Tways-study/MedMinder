"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function EmailChipInput({
  value,
  onChange,
  id,
}: {
  value: string[];
  onChange: (emails: string[]) => void;
  /** Id of the text input, so an external <label htmlFor> can target it. */
  id?: string;
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
          "flex min-h-11 cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-card px-2 py-1 sm:min-h-9",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
          error && "border-destructive",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((email) => (
          <span
            key={email}
            className="flex items-center gap-1 font-data rounded-sm bg-muted py-0.5 pl-2 pr-1 text-xs font-medium text-foreground"
          >
            {email}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeEmail(email);
              }}
              aria-label={`Remove ${email}`}
              className="flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3" strokeWidth={1.75} aria-hidden />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
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
          aria-label="Add email address"
          aria-invalid={error ? true : undefined}
          className="min-w-40 flex-1 bg-transparent px-1 py-1 text-base outline-none placeholder:text-muted-foreground sm:text-sm"
        />
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
