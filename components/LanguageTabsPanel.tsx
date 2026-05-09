"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DictionaryClient from "@/app/[language]/DictionaryClient";
import CommunityHub from "@/components/CommunityHub";
import LearnSession from "@/components/LearnSession";
import LockScreen from "@/components/LockScreen";
import RoomList from "@/components/chat/RoomList";
import { cn } from "@/lib/utils";
import type { Room, UserRole } from "@/lib/types";

type TabKey = "dictionary" | "learn" | "community" | "chatrooms";

const CORE_TABS: Array<{ key: TabKey; label: string }> = [
  { key: "dictionary", label: "Dictionary" },
  { key: "community", label: "Community" },
  { key: "learn", label: "Learn" },
  { key: "chatrooms", label: "Chatrooms" },
];

function tabHref(languageCode: string, tab: TabKey, communitySection: string | null) {
  if (tab === "dictionary") return `/${languageCode}`;
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (tab === "community") params.set("section", communitySection || "forum");
  return `/${languageCode}?${params.toString()}`;
}

function CommunitySuspenseFallback() {
  return <p className="text-sm text-[#757C76]">Loading community hub…</p>;
}

function LanguageTabsPanelInner({
  languageCode,
  viewerRole,
  languageMode,
  translationCoverage,
}: {
  languageCode: string;
  viewerRole: UserRole;
  languageMode: "archive" | "full";
  translationCoverage: number;
}) {
  const searchParams = useSearchParams();
  const rawTab = (searchParams.get("tab") || "dictionary").toLowerCase();
  const communitySection = searchParams.get("section");

  const migratedTab =
    rawTab === "learning" ? "learn" : rawTab === "moderator" ? "dictionary" : rawTab;

  let activeTab: TabKey = "dictionary";
  if (migratedTab === "learn") activeTab = "learn";
  else if (migratedTab === "chatrooms") activeTab = "chatrooms";
  else if (migratedTab === "community") activeTab = "community";

  const effectiveCommunitySection = communitySection ?? "forum";

  const [rooms, setRooms] = useState<Room[]>([]);
  const loadRooms = useCallback(async () => {
    const res = await fetch(`/api/rooms?language_code=${encodeURIComponent(languageCode)}`, { cache: "no-store" });
    if (!res.ok) return;
    setRooms((await res.json()) as Room[]);
  }, [languageCode]);

  useEffect(() => {
    if (activeTab !== "chatrooms") return undefined;
    const id = window.setTimeout(() => { void loadRooms(); }, 0);
    return () => window.clearTimeout(id);
  }, [activeTab, loadRooms]);

  const tabItems = useMemo(() => [...CORE_TABS], []);

  return (
    <div className="space-y-8">
      <nav
        className="flex flex-wrap gap-2 rounded-full border border-[#C3C8C1]/35 bg-[#F5F3EE] p-2"
        aria-label="Language archive tabs"
      >
        {tabItems.map(({ key, label }) => (
          <Link
            key={key}
            href={tabHref(languageCode, key, effectiveCommunitySection)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-[0.98]",
              activeTab === key ? "bg-[#1B3022] text-white" : "text-[#434843] hover:bg-[#E8EFE9]"
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div role="tabpanel">
        {activeTab === "dictionary" ? <DictionaryClient languageCode={languageCode} /> : null}

        {activeTab === "learn" ? (
          languageMode === "archive" ? (
            <LockScreen translationCoverage={translationCoverage} />
          ) : (
            <LearnSession languageCode={languageCode} />
          )
        ) : null}

        {activeTab === "community" ? (
          <Suspense fallback={<CommunitySuspenseFallback />}>
            <CommunityHub
              languageCode={languageCode}
              section={effectiveCommunitySection}
              queryString={searchParams.toString()}
              viewerRole={viewerRole}
              languageMode={languageMode}
            />
          </Suspense>
        ) : null}

        {activeTab === "chatrooms" ? (
          <Suspense fallback={<p className="text-sm text-[#757C76]">Opening chat circles…</p>}>
            <RoomList
              rooms={rooms}
              languageCode={languageCode}
              viewerRole={viewerRole}
              onCreateRoom={async (name, description) => {
                const res = await fetch("/api/rooms", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ language_code: languageCode, name, description }),
                });
                if (!res.ok) {
                  const payload = (await res.json().catch(() => ({}))) as { error?: string };
                  throw new Error(payload.error || "Failed to create room.");
                }
                await loadRooms();
              }}
            />
          </Suspense>
        ) : null}
      </div>
    </div>
  );
}

function PanelFallback() {
  return (
    <div className="space-y-8">
      <div className="h-14 animate-pulse rounded-full bg-[#E8EDE9]" />
      <div className="min-h-[200px] animate-pulse rounded-3xl bg-[#EFECE6]" />
    </div>
  );
}

/** Language tabs: Dictionary | Community | Learn. Moderator tools live under `/mod`. */
export default function LanguageTabsPanel(props: {
  languageCode: string;
  viewerRole: UserRole;
  languageMode: "archive" | "full";
  translationCoverage: number;
}) {
  return (
    <Suspense fallback={<PanelFallback />}>
      <LanguageTabsPanelInner {...props} />
    </Suspense>
  );
}
