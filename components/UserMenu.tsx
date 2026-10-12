"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import {
  Check,
  ChevronsUpDown,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

const THEMES = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export function UserMenu({
  variant = "icon",
}: {
  variant?: "icon" | "sidebar";
}) {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const viewer = useQuery(api.users.viewer);
  const { theme, setTheme } = useTheme();

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
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 size-4" aria-hidden />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {THEMES.map(({ value, label, icon: Icon }) => (
              <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
                <Icon className="mr-2 size-4" aria-hidden />
                {label}
                <Check
                  className={cn(
                    "ml-auto size-4",
                    (theme ?? "system") === value ? "opacity-100" : "opacity-0",
                  )}
                  aria-hidden
                />
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
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
