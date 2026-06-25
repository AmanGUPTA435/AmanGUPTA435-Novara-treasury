import { Header } from "@/components/Header";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen min-w-0 flex-col">
      <Header />
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-3 py-4 sm:px-6 sm:py-6">
        {children}
      </main>
    </div>
  );
}
