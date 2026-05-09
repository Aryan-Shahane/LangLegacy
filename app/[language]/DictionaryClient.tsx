"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DictionaryEntry from "@/components/DictionaryEntry";
import SearchBar from "@/components/SearchBar";
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
      setFetchError(e instanceof Error ? e.message : "Could not load dictionary");
      setEntries([]);
      setHasMore(false);
    } finally {
      setLoadingInitial(false);
    }
  }, [fetchSlice]);

  useEffect(() => {
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
      setFetchError(e instanceof Error ? e.message : "Could not load more entries");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-3">
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
      {loadingInitial ? <p className="text-sm text-slate-500">Loading full dictionary…</p> : null}
      {!loadingInitial && entries.length === 0 ? (
        <p className="text-sm text-slate-400">No entries yet for this language (or nothing matches your search).</p>
      ) : (
        <div className="grid gap-3">
          {entries.map((entry) => (
            <DictionaryEntry key={entry._id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
