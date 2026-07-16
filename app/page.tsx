import { UserMenu } from "@/components/UserMenu";

// Placeholder home. The dashboard replaces this once the design system exists.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">MedMinder</h1>
        <UserMenu />
      </header>
      <p className="text-sm text-muted-foreground">
        Signed in. The dashboard lands here.
      </p>
    </main>
  );
}
