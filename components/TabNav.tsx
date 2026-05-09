"use client";

import Link from "next/link";

const TABS = [
  { id: "dictionary", label: "Dictionary" },
  { id: "community", label: "Community" },
  { id: "chatrooms", label: "Chatrooms" },
  { id: "learning", label: "Learning" },
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
          href={`/${languageCode}?tab=${tab.id}`}
          className={`rounded px-3 py-1.5 text-sm ${
            activeTab === tab.id
              ? "bg-cyan-700 text-white"
              : "border border-slate-700 text-slate-300 hover:bg-slate-900"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
