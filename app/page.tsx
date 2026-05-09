"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import AddLanguageModal from "@/components/AddLanguageModal";
import SiteFooter from "@/components/SiteFooter";
import TopBar from "@/components/TopBar";
import LanguageCard from "@/components/LanguageCard";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import type { Language } from "@/lib/types";
import mauiFishImage from "@/Screenshot 2026-05-09 at 3.22.38 AM.png";

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

function DictionaryPanel({
  loading,
  filteredLanguages,
  error,
  onAddLanguage,
}: {
  loading: boolean;
  filteredLanguages: Language[];
  error: string | null;
  onAddLanguage: () => void;
}) {
  return (
    <section id="dictionary" className="scroll-mt-28 px-6 py-14 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-4xl text-[#1F2E27]">Living Archives</h2>
            <p className="mt-1 text-sm text-[#5A665F]">Explore our growing collection of ancestral voices.</p>
          </div>
          <Button
            type="button"
            onClick={onAddLanguage}
            variant="pill"
            className="rounded-full bg-[#1B3022] px-6 text-[#FBF9F4] hover:bg-[#061B0E]"
          >
            + Add Your Language
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? <p className="text-sm text-[#5A665F]">Loading archives...</p> : null}
          {!loading &&
            filteredLanguages.map((language) => (
              <div key={language._id} className="rounded-2xl bg-[#F5F3EE] p-1">
                <LanguageCard language={language} />
              </div>
            ))}
        </div>
        {!loading && !filteredLanguages.length && !error ? (
          <p className="mt-5 text-sm text-[#5A665F]">No language archives match this search.</p>
        ) : null}
        {error ? <p className="mt-5 text-sm text-[#A44927]">{error}</p> : null}
        <p className="mt-4 text-sm text-[#5A665F]">View all archives</p>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addLanguageOpen, setAddLanguageOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadLanguages = async () => {
      try {
        const response = await fetch("/api/languages", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to fetch language archives.");
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
    void loadLanguages();
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

  return (
    <div className="bg-[#FBF9F4] text-[#1B1C19]">
      <AddLanguageModal open={addLanguageOpen} onClose={() => setAddLanguageOpen(false)} />

      <TopBar activeTab="dictionary" />

      <section className="bg-[#1B3022] px-6 pb-20 pt-10 text-[#F4EEE5] md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#D9CDC0]">The Digital Hearth</p>
            <h1 className="mt-4 font-serif text-5xl leading-tight md:text-6xl">
              Preserve the Words That
              <br />
              <span className="font-normal italic">Shape a Culture</span>
            </h1>
          </div>
          <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-[#FBF9F4] p-2">
            <SearchBar query={query} onQueryChange={setQuery} totalLoaded={filteredLanguages.length} hasMore={false} />
          </div>
        </div>
      </section>

      <DictionaryPanel
        loading={loading}
        filteredLanguages={filteredLanguages}
        error={error}
        onAddLanguage={() => setAddLanguageOpen(true)}
      />

      <section className="bg-[#1B3022] px-6 py-14 text-[#F4EEE5] md:px-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#C8BBAD]">Voice of the Ancestors</p>
            <h3 className="mt-4 font-serif text-4xl">The Legend of Maui&apos;s Fish</h3>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#DDD3C8]">
              Listen to an oral storytelling archive from the Pacific, preserved and shared by the community. Each contribution helps keep
              language memory alive for future generations.
            </p>
            <div className="mt-8 rounded-xl bg-[#24463A] p-6">
              <div className="h-2 rounded-full bg-[#C4622D]/30">
                <div className="h-2 w-1/2 rounded-full bg-[#C4622D]" />
              </div>
              <div className="mt-3 flex justify-between text-xs text-[#C8BBAD]">
                <span>1:34</span>
                <span>4:58</span>
              </div>
            </div>
          </div>
          <div className="relative h-[360px] overflow-hidden rounded-2xl">
            <Image src={mauiFishImage} alt="Legend of Maui's Fish artwork" fill className="object-cover" />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
