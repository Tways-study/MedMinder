"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function UserMenu({
  variant = "icon",
}: {
  variant?: "icon" | "sidebar";
}) {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const viewer = useQuery(api.users.viewer);

  const email = viewer?.email ?? undefined;
  const initial = (email?.[0] ?? "?").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "sidebar" ? (
          <button
            type="button"
            className="focus-card flex h-11 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm transition-colors hover:bg-muted"
          >
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
            >
              {initial}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {email ?? "Account"}
            </span>
            <ChevronsUpDown
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="sr-only">Account menu</span>
          </button>
        ) : (
          <button
            type="button"
            className="focus-card flex size-11 items-center justify-center rounded-full transition-colors hover:bg-muted"
          >
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
            >
              {initial}
            </span>
            <span className="sr-only">Account menu</span>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={variant === "sidebar" ? "start" : "end"}
        side={variant === "sidebar" ? "top" : "bottom"}
        className="w-56"
      >
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {email ?? "Signed in"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            void signOut().then(() => router.push("/signin"));
          }}
        >
          <LogOut className="mr-2 size-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
