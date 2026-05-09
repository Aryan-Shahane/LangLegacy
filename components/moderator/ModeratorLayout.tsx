"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIDEBAR_NAV: Array<{ href: string; label: string }> = [
  { href: "/", label: "Overview" },
  { href: "/mod/reports", label: "Report queue" },
];

function sidebarLinkClass(active: boolean) {
  return cn(
    "w-full rounded-full px-4 py-2.5 text-left text-sm font-medium transition-colors",
    active ? "bg-[#1B3022] text-white" : "text-[#434843] hover:bg-[#E8EFE9]"
  );
}

function navItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname === "/mod";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function ModeratorLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF9F4] text-[#1B1C19]">
      <header className="sticky top-0 z-40 border-b border-[#253D30] bg-[#1B3022] text-[#D0E9D4]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="font-serif text-2xl text-white transition hover:text-[#E8EDE9]" aria-label="LangLegacy home">
              LangLegacy
            </Link>
            <span className="rounded-full border border-[#B4CDB8]/40 bg-[#2A4838] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D0E9D4]">
              Moderation
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/explore"
              className="rounded-full px-4 py-2 text-sm font-medium text-[#D0E9D4] underline-offset-4 transition hover:bg-[#30483A] hover:no-underline"
            >
              Public home
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loggingOut}
              onClick={() => void handleLogout()}
              className="border-[#B4CDB8]/50 bg-transparent text-[#D0E9D4] hover:bg-[#30483A] hover:text-white"
            >
              {loggingOut ? "Logging out…" : "Log out"}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-0 px-4 sm:px-6 lg:gap-10">
        <aside className="hidden w-[13.5rem] shrink-0 lg:block lg:border-r lg:border-[#C3C8C1]/25 lg:py-10">
          <nav className="sticky top-[5.25rem] space-y-1 pr-6" aria-label="Moderation">
            {SIDEBAR_NAV.map(({ href, label }) => {
              const active = navItemActive(pathname, href);
              return (
                <Link key={href} href={href} className={sidebarLinkClass(active)}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 py-8 lg:py-10">
          <nav className="mb-8 flex gap-2 overflow-x-auto rounded-full border border-[#C3C8C1]/35 bg-[#F5F3EE] p-1 lg:hidden" aria-label="Moderation">
            {SIDEBAR_NAV.map(({ href, label }) => {
              const active = navItemActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
                    active ? "bg-[#1B3022] text-white" : "text-[#434843] hover:bg-[#E8EFE9]"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <main>{children}</main>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
