import Link from "next/link";
import { getSessionFromCookie, viewerCanModerate } from "@/lib/auth";
import SiteFooter from "@/components/SiteFooter";
import TopBar from "@/components/TopBar";
import { getDocument } from "@/lib/cloudant";
import LanguageTabsPanel from "@/components/LanguageTabsPanel";
import { formatRelativeTime } from "@/lib/formatRelative";

function coerceLanguageHeader(raw: Record<string, unknown> | null): {
  name: string;
  region: string;
  entryCount: number;
  contributorCount: number;
  lastActivityIso: string | null;
  languageMode: "archive" | "full";
  translationCoverage: number;
} {
  if (!raw) {
    return {
      name: "",
      region: "",
      entryCount: 0,
      contributorCount: 0,
      lastActivityIso: null,
      languageMode: "archive",
      translationCoverage: 0,
    };
  }

  const entryCountRaw =
    typeof raw.entry_count === "number"
      ? raw.entry_count
      : typeof raw.entry_count === "string"
        ? Number(raw.entry_count) || 0
        : 0;

  let translationCoverage =
    typeof raw.translation_coverage === "number" && Number.isFinite(raw.translation_coverage)
      ? raw.translation_coverage
      : 0;
  if (
    translationCoverage === 0 &&
    entryCountRaw > 0 &&
    typeof raw.translated_entry_count === "number" &&
    Number.isFinite(raw.translated_entry_count)
  ) {
    translationCoverage = raw.translated_entry_count / entryCountRaw;
  }

  const storedMode = raw.mode === "full" || raw.mode === "archive" ? raw.mode : undefined;
  const languageMode: "archive" | "full" = storedMode === "full" ? "full" : "archive";

  return {
    name: typeof raw.name === "string" ? raw.name : "",
    region: typeof raw.region === "string" ? raw.region : "",
    entryCount: entryCountRaw,
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
    languageMode,
    translationCoverage,
  };
}

const MOCK_HEADERS: Record<string, Record<string, unknown>> = {
  mi: {
    _id: "mi",
    name: "Māori",
    region: "New Zealand",
    entry_count: 1204,
    translated_entry_count: 800,
    translation_coverage: 800 / 1204,
    mode: "full",
    moderator_mode_lock: false,
    contributor_count: 42,
    updated_at: new Date().toISOString(),
  },
  gam: {
    _id: "gam",
    name: "Gamilaraay",
    region: "New South Wales, Australia",
    entry_count: 312,
    translated_entry_count: 40,
    translation_coverage: 40 / 312,
    mode: "archive",
    contributor_count: 15,
    updated_at: new Date().toISOString(),
  },
  oj: {
    _id: "oj",
    name: "Anishinaabe",
    region: "Great Lakes Region",
    entry_count: 520,
    translated_entry_count: 400,
    translation_coverage: 400 / 520,
    mode: "full",
    contributor_count: 28,
    updated_at: new Date().toISOString(),
  },
  /** Local preview only: always archive-mode with partial coverage — open `/arq` then Learn tab */
  arq: {
    _id: "arq",
    name: "Aruqa Archive (demo)",
    region: "Fictitious region · UI preview",
    entry_count: 300,
    translated_entry_count: 102,
    translation_coverage: 0.34,
    mode: "archive",
    moderator_mode_lock: false,
    contributor_count: 6,
    updated_at: new Date().toISOString(),
  },
};

export default async function LanguageDictionaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ language: string }>;
  searchParams?: Promise<{ tab?: string; section?: string }>;
}) {
  const { language } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  let rawDoc = (await getDocument("languages", language)) as Record<string, unknown> | null;
  if (language === "arq") {
    rawDoc = MOCK_HEADERS.arq;
  } else if (!rawDoc && MOCK_HEADERS[language]) {
    rawDoc = MOCK_HEADERS[language];
  }

  const header = coerceLanguageHeader(rawDoc);
  const viewer = await getSessionFromCookie();
  const canModerate = viewerCanModerate(viewer);
  const dictionaryTitle = header.name || `${language} Dictionary`;
  const qpTab = resolvedSearchParams?.tab?.toLowerCase();

  let topBarActiveTab = "dictionary";
  if (qpTab === "learn" || qpTab === "learning") topBarActiveTab = "learn";
  else if (qpTab === "community" || qpTab === "chatrooms") topBarActiveTab = "community";

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
            {canModerate ? (
              <p className="mt-4">
                <Link href="/" className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1B3022] underline">
                  Moderator dashboard
                </Link>
              </p>
            ) : null}
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
        </div>
      </section>

      <section className="px-6 pb-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <LanguageTabsPanel
            languageCode={language}
            viewerRole={viewer?.role || "user"}
            languageMode={header.languageMode}
            translationCoverage={header.translationCoverage}
          />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
