"use client";

import { useEffect, useMemo, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import TopBar from "@/components/TopBar";
import LanguageExplorer from "@/components/LanguageExplorer";
import type { Entry, Language } from "@/lib/types";

const fallbackLanguages: Language[] = [
  {
    _id: "mi",
    type: "language",
    name: "Māori",
    code: "mi",
    region: "New Zealand",
    description: "Polynesian language of the Māori people",
    native_script: "Latin",
    speaker_count: null,
    entry_count: 1204,
    contributor_count: 42,
    created_at: "2026-05-08T00:00:00Z",
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: "cy",
    type: "language",
    name: "Welsh",
    code: "cy",
    region: "Wales",
    entry_count: 45300,
    contributor_count: 120,
    created_at: "2026-05-08T00:00:00Z",
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: "kw",
    type: "language",
    name: "Cornish",
    code: "kw",
    region: "Cornwall",
    entry_count: 8100,
    contributor_count: 56,
    created_at: "2026-05-08T00:00:00Z",
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

type HomeTab = "home";

export default function HomePage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [recentEntries, setRecentEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeTab: HomeTab = "home";

  useEffect(() => {
    let mounted = true;
    const loadLanguages = async () => {
      try {
        const response = await fetch("/api/languages", { cache: "no-store" });
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Unable to fetch language archives.");
        }
        const payload = (await response.json()) as Language[];
        if (mounted) {
          setLanguages([...payload].sort((a, b) => a.name.localeCompare(b.name)));
          setError(null);
        }
      } catch {
        if (mounted) {
          setLanguages(fallbackLanguages);
          setError("Could not load language archives.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const loadContributions = async () => {
      try {
        const response = await fetch("/api/contributions?limit=6", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to fetch contributions");
        }
        const payload = (await response.json()) as Entry[];
        if (mounted) {
          setRecentEntries(payload);
        }
      } catch {
        if (mounted) setRecentEntries([]);
      } finally {
        if (mounted) setRecentLoading(false);
      }
    };

    void loadLanguages();
    void loadContributions();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredLanguages = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return languages;
    return languages.filter((language) => {
      return (
        language.name.toLowerCase().includes(trimmed) ||
        language.code.toLowerCase().includes(trimmed) ||
        (language.region || "").toLowerCase().includes(trimmed)
      );
    });
  }, [languages, query]);

  const totalEntriesAcrossArchives = useMemo(() => languages.reduce((n, lang) => n + (lang.entry_count || 0), 0), [languages]);
  const totalContributorTally = useMemo(
    () => languages.reduce((n, lang) => n + (lang.contributor_count || 0), 0),
    [languages]
  );

  return (
    <div className="bg-[#FBF9F4] text-[#1B1C19]">
      <TopBar activeTab={activeTab} />

      <LanguageExplorer
        languages={languages}
        filteredLanguages={filteredLanguages}
        loading={loading}
        error={error}
        query={query}
        onQueryChange={setQuery}
        recentEntries={recentEntries}
        recentLoading={recentLoading}
        totalEntriesAcrossArchives={totalEntriesAcrossArchives}
        totalContributorTally={totalContributorTally}
      />

      <SiteFooter />
    </div>
  );
}
