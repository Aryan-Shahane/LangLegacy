"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import TopBar from "@/components/TopBar";
import SiteFooter from "@/components/SiteFooter";
import { Volume2, Search, Globe, Users, BookOpen } from "lucide-react";

type Language = {
  _id: string;
  name: string;
  code: string;
  region: string | null;
  description?: string | null;
  entry_count: number;
  contributor_count: number;
  speaker_count: number | null;
};

/* Map language codes to hero images if available */
const DIALECT_IMAGES: Record<string, string> = {
  mi: "/dialect-maori.png",
  gam: "/dialect-gamilaraay.png",
  oj: "/dialect-anishinaabe.png",
  cy: "/dialect-welsh.png",
  kw: "/dialect-cornish.png",
};

/* Status badges based on speaker count or code */
const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  mi: { label: "VITAL", bg: "bg-[#E5F0E8]", text: "text-[#1B3022]" },
  cy: { label: "VITAL", bg: "bg-[#E5F0E8]", text: "text-[#1B3022]" },
  gam: { label: "ENDANGERED", bg: "bg-[#FCE8E3]", text: "text-[#8A3620]" },
  kw: { label: "ENDANGERED", bg: "bg-[#FCE8E3]", text: "text-[#8A3620]" },
  oj: { label: "VULNERABLE", bg: "bg-[#E8EFF5]", text: "text-[#2B4C6F]" },
};

function getStatus(code: string) {
  return STATUS_MAP[code] || { label: "ARCHIVING", bg: "bg-[#F5F4F0]", text: "text-[#5A665F]" };
}

export default function DialectsPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/languages", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as Language[];
          setLanguages(data);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.region || "").toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  const totalEntries = languages.reduce((s, l) => s + (l.entry_count || 0), 0);
  const totalContributors = languages.reduce((s, l) => s + (l.contributor_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1B1C19]">
      <TopBar activeTab="dialects" />

      {/* Hero */}
      <section className="bg-[#1B3022] py-16 px-6 md:px-12">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#8DB596] mb-4">Language Archives</p>
          <h1 className="font-serif text-5xl text-white md:text-6xl">All Dialects</h1>
          <p className="mx-auto mt-4 max-w-2xl text-[#B4CDB8] text-lg">
            Choose a language to explore its dictionary, community, learning resources, and live chatrooms.
          </p>

          {/* Stats */}
          <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#243D2E] p-6 border border-[#2B4835]">
              <Globe className="mx-auto h-6 w-6 text-[#8DB596] mb-2" />
              <p className="font-serif text-3xl text-white">{languages.length}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-[#8DB596] mt-1">Languages</p>
            </div>
            <div className="rounded-2xl bg-[#243D2E] p-6 border border-[#2B4835]">
              <BookOpen className="mx-auto h-6 w-6 text-[#8DB596] mb-2" />
              <p className="font-serif text-3xl text-white">{totalEntries.toLocaleString()}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-[#8DB596] mt-1">Dictionary Entries</p>
            </div>
            <div className="rounded-2xl bg-[#243D2E] p-6 border border-[#2B4835]">
              <Users className="mx-auto h-6 w-6 text-[#8DB596] mb-2" />
              <p className="font-serif text-3xl text-white">{totalContributors.toLocaleString()}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-[#8DB596] mt-1">Contributors</p>
            </div>
          </div>

          {/* Search */}
          <div className="mx-auto mt-10 max-w-xl">
            <div className="flex items-center gap-3 rounded-full bg-[#243D2E] border border-[#2B4835] px-5 py-3">
              <Search className="h-5 w-5 text-[#8DB596] shrink-0" />
              <input
                type="text"
                placeholder="Search languages by name, region, or code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-white placeholder:text-[#5A7D64] text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Language Grid */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:px-12">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-[#EFECE6]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Globe className="mx-auto h-12 w-12 text-[#C3C8C1] mb-4" />
            <h3 className="font-serif text-2xl text-[#061B0E] mb-2">No languages found</h3>
            <p className="text-[#5A665F]">Try a different search term or add a new language.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((lang) => {
              const status = getStatus(lang.code);
              const imageSrc = DIALECT_IMAGES[lang.code] || "/hero-bg.png";
              return (
                <Link key={lang._id} href={`/${lang.code}`} className="group block">
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md border border-[#E3DFD6]/60 h-full flex flex-col">
                    {/* Image or gradient placeholder */}
                    <div className="relative h-40 w-full overflow-hidden">
                      <Image 
                        src={imageSrc} 
                        alt={lang.name} 
                        fill 
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <span className={`absolute top-3 right-3 rounded-full ${status.bg} px-3 py-1 text-[10px] font-bold tracking-wider ${status.text}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-serif text-xl text-[#1B3022]">{lang.name}</h3>
                        <span className="text-xs text-[#8A3620] font-mono">{lang.code}</span>
                      </div>
                      {lang.region ? (
                        <p className="text-xs text-[#5A665F] mb-3">{lang.region}</p>
                      ) : null}
                      {lang.description ? (
                        <p className="text-sm text-[#434843] mb-4 line-clamp-2 flex-1">{lang.description}</p>
                      ) : (
                        <div className="flex-1" />
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-[#E3DFD6]/60">
                        <div className="flex items-center gap-4 text-xs text-[#5A665F]">
                          <span className="font-semibold">{lang.entry_count.toLocaleString()} entries</span>
                          <span>{lang.contributor_count} contributors</span>
                        </div>
                        <Volume2 className="h-4 w-4 text-[#8A3620]" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
