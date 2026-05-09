"use client";

import { useEffect, useState } from "react";
import type { Entry } from "@/lib/types";

type Props = {
  languageCode: string;
  onResults: (entries: Entry[]) => void;
};

export default function SearchBar({ languageCode, onResults }: Props) {
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(0);

  useEffect(() => {
    const handle = setTimeout(async () => {
      const params = new URLSearchParams({ language_code: languageCode, q: query, limit: "100", offset: "0" });
      const res = await fetch(`/api/entries?${params.toString()}`);
      if (!res.ok) return;
      const entries = (await res.json()) as Entry[];
      setCount(entries.length);
      onResults(entries);
    }, 300);
    return () => clearTimeout(handle);
  }, [languageCode, onResults, query]);

  return (
    <div className="panel">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search word or translation..."
          className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
        />
        <button type="button" onClick={() => setQuery("")} className="rounded bg-slate-700 px-3 py-2">
          x
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-400">{count} results</p>
    </div>
  );
}
