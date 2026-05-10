"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import DictionaryEntry from "@/components/DictionaryEntry";
import SearchBar from "@/components/SearchBar";
import { cn } from "@/lib/utils";
import type { Entry } from "@/lib/types";

const PAGE_SIZE = 50;

export default function DictionaryClient({ languageCode }: { languageCode: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [canModerate, setCanModerate] = useState(false);
  const nextOffsetRef = useRef(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const fetchSlice = useCallback(
    async (offset: number) => {
      const params = new URLSearchParams({
        language_code: languageCode,
        q: debouncedQuery,
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      const res = await fetch(`/api/entries?${params.toString()}`);
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Failed to load entries (${res.status})`);
      }
      return (await res.json()) as Entry[];
    },
    [languageCode, debouncedQuery]
  );

  const resetAndLoadFirst = useCallback(async () => {
    setFetchError(null);
    setLoadingInitial(true);
    nextOffsetRef.current = 0;
    try {
      const slice = await fetchSlice(0);
      nextOffsetRef.current = slice.length;
      setEntries(slice);
      setHasMore(slice.length === PAGE_SIZE);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not load dictionary";
      setFetchError(/cloudant|credentials|401/i.test(message) ? message : "Could not load dictionary entries.");
      setEntries([]);
      setHasMore(false);
    } finally {
      setLoadingInitial(false);
    }
  }, [fetchSlice]);

  useEffect(() => {
    // Fetch user role
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { can_moderate?: boolean }) => {
        setCanModerate(!!data.can_moderate);
      })
      .catch(() => {});
      
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dictionary loads from API when language/search changes
    void resetAndLoadFirst();
  }, [resetAndLoadFirst]);

  const loadMore = async () => {
    if (!hasMore || loadingMore || loadingInitial) return;
    setFetchError(null);
    setLoadingMore(true);
    try {
      const slice = await fetchSlice(nextOffsetRef.current);
      nextOffsetRef.current += slice.length;
      setEntries((prev) => [...prev, ...slice]);
      setHasMore(slice.length === PAGE_SIZE);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not load more entries";
      setFetchError(message);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl text-[#061B0E]">Dictionary entries</h2>
        <div className="flex items-center gap-3">
          {canModerate && entries.length > 0 && (
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Are you sure you want to delete ALL entries for this language? This cannot be undone.")) return;
                try {
                  const res = await fetch(`/api/entries?language_code=${languageCode}`, { method: "DELETE" });
                  if (!res.ok) throw new Error("Failed to clear entries");
                  void resetAndLoadFirst();
                } catch (e) {
                  alert("Could not clear entries.");
                }
              }}
              className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
            >
              Clear All Entries
            </button>
          )}
          <Link
            href={`/${languageCode}/contribute`}
            className={cn(
              "inline-flex items-center justify-center rounded-full bg-[#1B3022] px-5 py-2 text-sm font-semibold text-[#FBF9F4] transition hover:bg-[#061B0E]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9F4026]/40"
            )}
          >
            + Contribute Recording
          </Link>
        </div>
      </div>

      <SearchBar
        query={query}
        onQueryChange={setQuery}
        totalLoaded={entries.length}
        hasMore={hasMore && !loadingInitial}
        onLoadMore={loadMore}
        loadingMore={loadingMore}
      />

      {fetchError ? (
        <p className="rounded border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">{fetchError}</p>
      ) : null}

      {loadingInitial ? <p className="text-sm text-[#5A665F]">Loading dictionary…</p> : null}

      {!loadingInitial && entries.length === 0 && !fetchError ? (
        <p className="text-base text-[#434843]">Be the first contributor to preserve this language.</p>
      ) : null}

      {!loadingInitial && entries.length > 0 ? (
        <div className="grid gap-3">
          {entries.map((entry) => (
            <DictionaryEntry key={entry._id} entry={entry} canModerate={canModerate} onTranslationSaved={resetAndLoadFirst} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
