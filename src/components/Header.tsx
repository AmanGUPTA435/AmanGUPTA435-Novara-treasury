"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWallet } from "@/components/ConnectWallet";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/activity", label: "Activity" },
  { href: "/docs", label: "Documentation" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-novara-line/80 bg-[#08090d]/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Link href="/" className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-novara-gold">
              Novara
            </p>
            <h1 className="truncate text-lg font-semibold tracking-[0.14em] text-zinc-100 sm:text-xl">
              NOVARA TREASURY
            </h1>
          </Link>
          <div className="lg:hidden">
            <ConnectWallet />
          </div>
        </div>

        <nav className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-2 py-1 transition-colors ${
                  active ? "text-novara-gold2" : "text-novara-mist hover:text-zinc-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
