import Link from "next/link";
import { getSessionFromCookie } from "@/lib/auth";
import SiteFooter from "@/components/SiteFooter";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { getDocument } from "@/lib/cloudant";
import LanguageTabsPanel from "@/components/LanguageTabsPanel";
import { formatRelativeTime } from "@/lib/formatRelative";

function coerceLanguageHeader(raw: Record<string, unknown> | null): {
  name: string;
  region: string;
  entryCount: number;
  contributorCount: number;
  lastActivityIso: string | null;
} {
  if (!raw) {
    return {
      name: "",
      region: "",
      entryCount: 0,
      contributorCount: 0,
      lastActivityIso: null,
    };
  }

  return {
    name: typeof raw.name === "string" ? raw.name : "",
    region: typeof raw.region === "string" ? raw.region : "",
    entryCount:
      typeof raw.entry_count === "number"
        ? raw.entry_count
        : typeof raw.entry_count === "string"
          ? Number(raw.entry_count) || 0
          : 0,
    contributorCount:
      typeof raw.contributor_count === "number"
        ? raw.contributor_count
        : typeof raw.contributor_count === "string"
          ? Number(raw.contributor_count) || 0
          : 0,
    lastActivityIso:
      typeof raw.updated_at === "string"
        ? raw.updated_at
        : typeof raw.created_at === "string"
          ? raw.created_at
          : null,
  };
}

export default async function LanguageDictionaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ language: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { language } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawDoc = (await getDocument("languages", language)) as Record<string, unknown> | null;
  const header = coerceLanguageHeader(rawDoc);
  const viewer = await getSessionFromCookie();
  const dictionaryTitle = header.name || `${language} Dictionary`;
  const activeTab = (resolvedSearchParams?.tab || "dictionary").toLowerCase();
  const topBarActiveTab = activeTab === "dictionary" ? "home" : activeTab;

  const tabs = [
    { id: "dictionary", label: "Dictionary" },
    { id: "community", label: "Community" },
    { id: "chatrooms", label: "Chatrooms" },
    { id: "learning", label: "Learning" },
  ];

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1B1C19]">
      <TopBar activeTab={topBarActiveTab} languageCode={language} />

      <section className="px-6 py-12 md:px-12">
        <div className="mx-auto max-w-6xl space-y-4 text-center">
          <header>
            <h1 className="font-serif text-5xl text-[#061B0E]">{dictionaryTitle}</h1>
            <p className="mx-auto mt-3 max-w-2xl text-[#434843]">
              {header.region ? (
                <>
                  Explore the living archive of <span className="font-medium text-[#061B0E]">{header.region}</span>. Search entries,
                  listen to pronunciation, and grow the communal dictionary.
                </>
              ) : (
                <>
                  Explore the living breath of our communities. Search for words, phrases, and pronunciation samples within our
                  collaborative archive.
                </>
              )}
            </p>
            <dl className="mx-auto mt-6 grid max-w-3xl gap-4 rounded-3xl border border-[#C3C8C1]/35 bg-[#F5F3EE] p-6 text-sm text-[#434843] sm:grid-cols-3">
              <div className="text-center">
                <dt className="text-xs uppercase tracking-[0.3em] text-[#757C76]">Total entries</dt>
                <dd className="mt-2 text-3xl font-serif text-[#061B0E]">{header.entryCount.toLocaleString()}</dd>
              </div>
              <div className="text-center">
                <dt className="text-xs uppercase tracking-[0.3em] text-[#757C76]">Contributors</dt>
                <dd className="mt-2 text-3xl font-serif text-[#061B0E]">{header.contributorCount.toLocaleString()}</dd>
              </div>
              <div className="text-center">
                <dt className="text-xs uppercase tracking-[0.3em] text-[#757C76]">Latest activity</dt>
                <dd className="mt-2 text-lg font-semibold text-[#061B0E]">
                  {header.lastActivityIso ? formatRelativeTime(header.lastActivityIso) : "—"}
                </dd>
              </div>
            </dl>
          </header>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-6" aria-label="Dictionary tabs">
            {tabs.map((tab) => {
              const href = `/${language}?tab=${tab.id}`;
              const isActive = activeTab === tab.id || (tab.id === "dictionary" && !resolvedSearchParams?.tab);
              return (
                <Link key={tab.id} href={href}>
                  <Button variant={isActive ? "pill" : "outline"} size="sm">
                    {tab.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <LanguageTabsPanel languageCode={language} viewerRole={viewer?.role || "user"} />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
