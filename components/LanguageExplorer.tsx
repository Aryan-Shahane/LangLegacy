"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AddLanguageModal from "@/components/AddLanguageModal";
import LanguageCard from "@/components/LanguageCard";
import SearchBar from "@/components/SearchBar";
import type { Entry, Language } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/formatRelative";

const FEATURE_ORDER = ["mi", "cy", "kw"];

type Props = {
  languages: Language[];
  filteredLanguages: Language[];
  loading: boolean;
  error: string | null;
  query: string;
  onQueryChange: (v: string) => void;
  recentEntries: Entry[];
  recentLoading: boolean;
  totalEntriesAcrossArchives: number;
  totalContributorTally: number;
};

export default function LanguageExplorer({
  languages,
  filteredLanguages,
  loading,
  error,
  query,
  onQueryChange,
  recentEntries,
  recentLoading,
  totalEntriesAcrossArchives,
  totalContributorTally,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);

  const featured = useMemo(() => {
    const byCode = new Map(languages.map((l) => [l.code, l]));
    return FEATURE_ORDER.map((code) => byCode.get(code)).filter(Boolean) as Language[];
  }, [languages]);

  const noLanguagesEver = !loading && !languages.length && !error;

  return (
    <>
      <AddLanguageModal open={addOpen} onClose={() => setAddOpen(false)} />

      <section className="bg-[#1B3022] px-6 pb-20 pt-10 text-[#F4EEE5] md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#D9CDC0]">LangLegacy Dictionary</p>
            <h1 className="mt-4 font-serif text-5xl leading-tight md:text-6xl">Browse Languages</h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-[#C8BBAD]">
              Search archives, preserve endangered languages, and build a community-driven pronunciation reference together.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-[#FBF9F4] p-2">
            <SearchBar
              placeholder="Search by language name, code, or region…"
              query={query}
              onQueryChange={onQueryChange}
              totalLoaded={filteredLanguages.length}
              hasMore={false}
            />
          </div>
          <div className="mx-auto mt-8 flex justify-center gap-4">
            <Button
              type="button"
              onClick={() => setAddOpen(true)}
              className="rounded-full bg-[#B4CDB8] px-8 text-[#0B2013] hover:bg-[#9BB89F]"
            >
              + Add Your Language
            </Button>
          </div>
          <dl className="mx-auto mt-10 grid max-w-3xl gap-4 text-center text-sm text-[#C8BBAD] sm:grid-cols-3">
            <div>
              <dt className="uppercase tracking-wider text-[10px] text-[#9A8F84]">Archives live</dt>
              <dd className="mt-1 text-3xl font-serif text-[#F4EEE5]">{loading ? "—" : languages.length}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wider text-[10px] text-[#9A8F84]">Dictionary rows</dt>
              <dd className="mt-1 text-3xl font-serif text-[#F4EEE5]">{loading ? "—" : totalEntriesAcrossArchives}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wider text-[10px] text-[#9A8F84]">Contributors counted</dt>
              <dd className="mt-1 text-3xl font-serif text-[#F4EEE5]">{loading ? "—" : totalContributorTally}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="border-b border-[#C3C8C1]/25 bg-[#F5F3EE]/60 px-6 py-12 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-3xl text-[#1F2E27]">Featured Languages</h2>
          <p className="mt-2 text-sm text-[#5A665F]">Seed collections for Māori, Welsh, and Cornish archives.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.length
              ? featured.map((language) => (
                  <LanguageCard key={language._id} language={language} />
                ))
              : !loading &&
                featuredFallback}
          </div>
        </div>
      </section>

      <section id="dictionary" className="px-6 py-14 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-4xl text-[#1F2E27]">Language Grid</h2>
          <p className="mt-1 text-sm text-[#5A665F]">
            Search results {query.trim() ? `for "${query.trim()}"` : "cover every archive you can access."}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {loading ? <p className="text-sm text-[#5A665F]">Loading archives...</p> : null}
            {!loading &&
              filteredLanguages.map((language) => (
                <LanguageCard key={language._id} language={language} />
              ))}
          </div>

          {!loading && !filteredLanguages.length && !noLanguagesEver ? (
            <p className="mt-5 text-sm text-[#5A665F]">No language archives match this search.</p>
          ) : null}
          {noLanguagesEver ? (
            <p className="mt-5 text-[#434843]" data-testid="empty-languages-home">
              No language archives yet.
              <span className="mt-2 block font-medium text-[#061B0E]">Start the first one.</span>
            </p>
          ) : null}
          {error ? (
            <p className="mt-5 text-sm text-[#A44927]" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </section>

      <section className="bg-[#FBF9F4] px-6 py-14 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-4xl text-[#1F2E27]">Recent Contributions</h2>
          <p className="mt-1 text-sm text-[#5A665F]">Latest dictionary rows saved across clouds.</p>
          <div className="mt-6 space-y-3">
            {recentLoading ? <p className="text-sm text-[#5A665F]">Loading recent contributions…</p> : null}
            {!recentLoading && !recentEntries.length ? (
              <p className="text-sm text-[#434843]">No contributions synced yet.</p>
            ) : null}
            {recentEntries.map((entry) => (
              <div
                key={entry._id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#C3C8C1]/35 bg-[#F5F3EE] p-4 text-sm text-[#1B1C19]"
              >
                <div>
                  <span className="font-serif text-lg text-[#061B0E]">{entry.word}</span>
                  <span className="ml-3 text-[#434843]">{entry.translation}</span>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#757C76]">{entry.language_code}</p>
                </div>
                <div className="text-xs text-[#5A665F]">
                  {entry.contributor_name ? `Contributor ${entry.contributor_name}` : "Contributor unknown"}
                  {entry.created_at ? ` · Saved ${formatRelativeTime(entry.created_at)}` : ""}
                </div>
                <Link
                  href={`/${entry.language_code}`}
                  className="rounded-full border border-[#1B3022]/30 px-3 py-1 text-[#061B0E] hover:bg-[#1B3022]/10"
                >
                  View dictionary
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

const featuredFallback = (
  <p className="sm:col-span-2 lg:col-span-3 text-sm text-[#5A665F]">Load Cloudant-backed languages to spotlight featured archives.</p>
);
