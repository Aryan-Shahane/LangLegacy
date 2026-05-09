"use client";

import { useCallback, useEffect, useState } from "react";
import DictionaryEntry from "@/components/DictionaryEntry";
import SearchBar from "@/components/SearchBar";
import type { Entry } from "@/lib/types";

export default function DictionaryClient({ languageCode }: { languageCode: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);

  const loadAll = useCallback(async () => {
    const params = new URLSearchParams({
      language_code: languageCode,
      q: "",
      limit: "200",
      offset: "0",
    });
    const res = await fetch(`/api/entries?${params.toString()}`);
    if (!res.ok) return;
    setEntries((await res.json()) as Entry[]);
  }, [languageCode]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  return (
    <div className="space-y-3">
      <SearchBar languageCode={languageCode} onResults={setEntries} />
      <div className="grid gap-3">
        {entries.map((entry) => (
          <DictionaryEntry key={entry._id} entry={entry} />
        ))}
      </div>
      {!entries.length ? (
        <p className="text-sm text-slate-400">No entries yet for this language.</p>
      ) : null}
    </div>
  );
}
