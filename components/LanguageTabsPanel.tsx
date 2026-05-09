"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DictionaryClient from "@/app/[language]/DictionaryClient";
import CommunityHub from "@/components/CommunityHub";
import LearnSession from "@/components/LearnSession";
import ModeratorQueue from "@/components/moderator/ModeratorQueue";
import { Card } from "@/components/ui/card";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

type TabKey = "dictionary" | "learn" | "community" | "moderator";

const CORE_TABS: Array<{ key: TabKey; label: string }> = [
  { key: "dictionary", label: "Dictionary" },
  { key: "learn", label: "Learn" },
  { key: "community", label: "Community" },
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
  canModerate,
}: {
  languageCode: string;
  viewerRole: UserRole;
  canModerate: boolean;
}) {
  void viewerRole;
  const searchParams = useSearchParams();
  const rawTab = (searchParams.get("tab") || "dictionary").toLowerCase();
  const communitySection = searchParams.get("section");

  const migratedTab = rawTab === "learning" || rawTab === "chatrooms" ? "learn" : rawTab;
  let activeTab: TabKey = "dictionary";
  if (migratedTab === "dictionary" || migratedTab === "learn" || migratedTab === "community" || migratedTab === "moderator") {
    activeTab = migratedTab;
  }

  const showModeratorView = activeTab === "moderator";

  const tabItems = useMemo(() => {
    const list = [...CORE_TABS];
    if (canModerate) list.push({ key: "moderator", label: "Moderator" });
    return list;
  }, [canModerate]);

  return (
    <div className="space-y-8">
      <nav
        className="flex flex-wrap gap-2 rounded-full border border-[#C3C8C1]/35 bg-[#F5F3EE] p-2"
        aria-label="Language archive tabs"
      >
        {tabItems.map(({ key, label }) => (
          <Link
            key={key}
            href={tabHref(languageCode, key, communitySection)}
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
        {activeTab === "learn" ? <LearnSession languageCode={languageCode} /> : null}

        {activeTab === "community" ? (
          <Suspense fallback={<CommunitySuspenseFallback />}>
            <CommunityHub
              languageCode={languageCode}
              section={communitySection}
              queryString={searchParams.toString()}
            />
          </Suspense>
        ) : null}

        {showModeratorView && canModerate ? (
          <div className="space-y-4">
            <Card className="border-[#C3C8C1]/35 bg-[#F5F3EE] p-5">
              <h2 className="font-serif text-3xl text-[#061B0E]">Report queue · {languageCode}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#434843]">
                Remove content hides it archive-wide when someone has marked it harmful; dismiss clears the alert while keeping the
                post, poem, or story live.
              </p>
              <Link href="/mod/reports" className="mt-3 inline-block text-xs font-semibold uppercase tracking-[0.14em] text-[#1B3022] underline">
                Open global queue
              </Link>
            </Card>
            <ModeratorQueue languageCodeFilter={languageCode} />
          </div>
        ) : null}

        {showModeratorView && !canModerate ? (
          <Card className="border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
            <p>You need moderator access to review reported content.</p>
            <Link className="mt-3 inline-block font-semibold underline" href={`/${languageCode}`}>
              Back to dictionary
            </Link>
          </Card>
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

/** COMMUNITY tab shell: Dictionary | Learn | Community hub | Moderator (role / env gated). */
export default function LanguageTabsPanel(props: {
  languageCode: string;
  viewerRole: UserRole;
  canModerate: boolean;
}) {
  return (
    <Suspense fallback={<PanelFallback />}>
      <LanguageTabsPanelInner {...props} />
    </Suspense>
  );
}
