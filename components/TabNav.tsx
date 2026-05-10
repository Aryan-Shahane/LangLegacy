"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "dictionary", label: "Dictionary" },
  { id: "learn", label: "Learn" },
  { id: "community", label: "Community" },
  { id: "chatrooms", label: "Chatrooms" },
] as const;

export type LanguageTab = (typeof TABS)[number]["id"];

export default function TabNav({
  languageCode,
  activeTab,
}: {
  languageCode: string;
  activeTab: string;
}) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Language sections">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={
            tab.id === "dictionary"
              ? "/dialects"
              : tab.id === "community"
                ? `/${languageCode}?tab=community&section=forum`
                : `/${languageCode}?tab=${tab.id}`
          }
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
            activeTab === tab.id ? "bg-[#D0E9D4] text-[#0B2013]" : "text-[#D0E9D4] hover:bg-[#30483A]"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
