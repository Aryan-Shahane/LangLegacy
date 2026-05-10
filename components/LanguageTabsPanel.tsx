"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DictionaryClient from "@/app/[language]/DictionaryClient";
import CommunityHub from "@/components/CommunityHub";
import LearnSession from "@/components/LearnSession";
import LockScreen from "@/components/LockScreen";
import RoomList from "@/components/chat/RoomList";
import type { Room, UserRole } from "@/lib/types";

type TabKey = "dictionary" | "learn" | "community" | "chatrooms";

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

  return (
    <div className="space-y-8">
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
      <div className="min-h-[200px] animate-pulse rounded-3xl bg-[#EFECE6]" />
    </div>
  );
}

/** Archive sections (tab from URL). Primary section links are in the site TopBar. */
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
