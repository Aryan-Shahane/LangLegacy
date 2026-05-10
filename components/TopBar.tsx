"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NotificationsBell from "@/components/NotificationsBell";
import { cn } from "@/lib/utils";

/** Landing `/`: Dictionary (dialects) + Community + Learn + Chatrooms. */
const LANDING_TABS = [
  { id: "dictionary", label: "Dictionary" },
  { id: "community", label: "Community" },
  { id: "learn", label: "Learn" },
  { id: "chatrooms", label: "Chatrooms" },
] as const;

/** Per-language: Dictionary · Community hub · Learn · Chatrooms. */
const LANGUAGE_TABS = [
  { id: "dictionary", label: "Dictionary" },
  { id: "community", label: "Community" },
  { id: "learn", label: "Learn" },
  { id: "chatrooms", label: "Chatrooms" },
] as const;

type Props = {
  activeTab: string;
  languageCode?: string;
};

export default function TopBar({ activeTab, languageCode }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [canModerate, setCanModerate] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { authenticated?: boolean; can_moderate?: boolean };
        if (active) {
          setIsAuthenticated(Boolean(payload.authenticated));
          setCanModerate(Boolean(payload.can_moderate));
        }
      } finally {
        if (active) {
          setCheckedAuth(true);
        }
      }
    };
    void loadSession();
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setMenuOpen(false);
      setIsAuthenticated(false);
      setCanModerate(false);
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const migratedActive =
    activeTab === "learning"
      ? "learn"
      : activeTab === "chatrooms"
        ? "chatrooms"
        : activeTab === "moderator"
          ? "dictionary"
          : activeTab;

  const tabs = languageCode ? LANGUAGE_TABS : LANDING_TABS;

  const isTabActive = (tabId: string) => {
    if (migratedActive === tabId) return true;
    if (tabId === "dictionary" && pathname === "/dialects") return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#C3C8C1]/20 bg-[#1B3022] text-[#D0E9D4]">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-serif text-3xl text-white">
            LangLegacy
          </Link>
          <nav className="flex items-center gap-1" aria-label="Primary">
            {tabs.map((tab) => {
              let href: string;
              if (languageCode) {
                if (tab.id === "dictionary") {
                  href = "/dialects";
                } else if (tab.id === "community") {
                  href = `/${languageCode}?tab=community&section=forum`;
                } else if (tab.id === "chatrooms") {
                  href = `/${languageCode}?tab=chatrooms`;
                } else {
                  href = `/${languageCode}?tab=${tab.id}`;
                }
              } else if (tab.id === "dictionary") {
                href = "/dialects";
              } else if (tab.id === "community") {
                href = `/mi?tab=community&section=forum`;
              } else if (tab.id === "chatrooms") {
                href = `/mi?tab=chatrooms`;
              } else {
                href = `/mi?tab=learn`;
              }
              return (
                <Link
                  key={tab.id}
                  href={href}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-all active:scale-[0.98]",
                    isTabActive(tab.id) ? "bg-[#B4CDB8] text-[#0B2013]" : "text-[#D0E9D4] hover:bg-[#30483A]"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
            {checkedAuth && canModerate ? (
              <Link
                href="/"
                className={cn(
                  "ml-2 border-l border-[#C3C8C1]/25 pl-3 text-sm font-medium transition-all active:scale-[0.98]",
                  pathname === "/" || pathname === "/mod"
                    ? "rounded-full bg-[#B4CDB8] px-4 py-1.5 text-[#0B2013]"
                    : "rounded-full px-4 py-1.5 text-[#E8F5EA] hover:bg-[#30483A]"
                )}
              >
                Dashboard
              </Link>
            ) : null}
          </nav>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
          <Link
            href="/dialects"
            className="flex items-center rounded-full border border-[#C3C8C1]/20 bg-[#31493B] px-4 py-2 text-sm text-[#B4CDB8] transition hover:bg-[#3a5848]"
          >
            All Dialects
          </Link>
          <NotificationsBell />
          {checkedAuth && !isAuthenticated ? (
            <Link
              href="/auth"
              className="rounded-full bg-[#B24A2D] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#8A3620]"
            >
              Sign In
            </Link>
          ) : (
            <div className="relative">
              <button
                type="button"
                disabled={loggingOut}
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Account menu"
                title="Account menu"
                className="grid h-9 w-9 place-content-center rounded-full border border-[#C3C8C1]/30 text-lg transition hover:bg-[#30483A] disabled:opacity-60"
              >
                ○
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-11 min-w-[120px] rounded-md border border-[#C3C8C1]/20 bg-[#22382B] p-1 shadow-lg">
                  <button
                    type="button"
                    disabled={loggingOut}
                    onClick={() => void handleLogout()}
                    className="w-full rounded px-3 py-2 text-left text-sm text-[#D0E9D4] transition hover:bg-[#30483A] disabled:opacity-60"
                  >
                    {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
