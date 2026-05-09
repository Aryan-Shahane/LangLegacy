"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "dictionary", label: "Dictionary" },
  { id: "community", label: "Community" },
  { id: "chatrooms", label: "Chatrooms" },
  { id: "learning", label: "Learning" },
] as const;

type Props = {
  activeTab: string;
  languageCode?: string;
};

export default function TopBar({ activeTab, languageCode }: Props) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    let active = true;
    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { authenticated?: boolean };
        if (active) {
          setIsAuthenticated(Boolean(payload.authenticated));
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
    const confirmed = window.confirm("Logout?");
    if (!confirmed) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsAuthenticated(false);
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#C3C8C1]/20 bg-[#1B3022] text-[#D0E9D4]">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-serif text-3xl text-white">
            LangLegacy
          </Link>
          <nav className="flex items-center gap-1" aria-label="Primary">
            {TABS.map((tab) => {
              const href = languageCode ? `/${languageCode}?tab=${tab.id}` : `/?tab=${tab.id}`;
              return (
                <Link
                  key={tab.id}
                  href={href}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-all active:scale-[0.98]",
                    activeTab === tab.id ? "bg-[#B4CDB8] text-[#0B2013]" : "text-[#D0E9D4] hover:bg-[#30483A]"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center rounded-full border border-[#C3C8C1]/20 bg-[#31493B] px-4 py-2 text-sm text-[#B4CDB8]">
            Search dictionary...
          </div>
          {checkedAuth && !isAuthenticated ? (
            <Link
              href="/auth"
              className="rounded-full border border-[#C3C8C1]/30 px-4 py-2 text-sm font-medium text-[#D0E9D4] transition hover:bg-[#30483A]"
            >
              Login / Sign up
            </Link>
          ) : (
            <button
              type="button"
              disabled={loggingOut}
              onClick={() => void handleLogout()}
              aria-label="Log out"
              title="Log out"
              className="grid h-9 w-9 place-content-center rounded-full border border-[#C3C8C1]/30 text-lg transition hover:bg-[#30483A] disabled:opacity-60"
            >
              ○
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
