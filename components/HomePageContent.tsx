"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import TopBar from "@/components/TopBar";
import mauiFishImage from "@/Screenshot 2026-05-09 at 3.22.38 AM.png";
import { Play, Mic, FileText, CheckCircle2, ShieldCheck, BookOpen, Volume2 } from "lucide-react";

type LangStats = { count: number; entries: number; contributors: number };

function useLangStats(): LangStats {
  const [stats, setStats] = useState<LangStats>({ count: 0, entries: 0, contributors: 0 });
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/languages", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Array<{ entry_count?: number; contributor_count?: number }>;
        setStats({
          count: data.length,
          entries: data.reduce((s, l) => s + (l.entry_count || 0), 0),
          contributors: data.reduce((s, l) => s + (l.contributor_count || 0), 0),
        });
      } catch {
        /* ignore */
      }
    };
    void load();
  }, []);
  return stats;
}

function fmtStat(n: number, placeholder: string) {
  if (n <= 0) return placeholder;
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1)}k`.replace(/\.0k$/, "k");
  return `${Math.round(n / 1000)}k`;
}

export default function HomePageContent() {
  const stats = useLangStats();
  return (
    <div className="bg-[#F5F4F0] text-[#1B1C19] min-h-screen font-sans">
      <TopBar activeTab="home" />

      {/* Hero Section */}
      <section className="relative flex h-[600px] flex-col items-center justify-center overflow-hidden px-6 text-center md:h-[700px] md:px-12">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.png"
            alt="Mystical ancient forest"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1B3022]/60 via-[#1B3022]/40 to-[#F5F4F0]" />
        </div>

        <div className="relative z-10 max-w-4xl pt-20">
          <h1 className="font-serif text-5xl leading-tight text-[#FBF9F4] md:text-7xl">
            Preserve the Echo of Ancestral Voices
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#E3DFD6] md:text-xl">
            Bridging the chasm that grew between our elders&apos; wisdom and the youth&apos;s curiosity through an audio-first archive of endangered languages.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/dialects" className="inline-flex items-center justify-center rounded-full bg-[#B24A2D] px-8 py-6 text-[15px] font-semibold text-white transition-colors hover:bg-[#8A3620]">
              Explore Archives
            </Link>
            <Link href="/auth" className="inline-flex items-center justify-center rounded-full border border-[#E3DFD6] bg-white/10 px-8 py-6 text-[15px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-[#E3DFD6] bg-[#FBF9F4] py-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-around gap-8 px-6 text-center md:px-12">
          <div>
            <p className="font-serif text-5xl text-[#8A3620]">{fmtStat(stats.contributors, "—")}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#5A665F]">Contributors</p>
          </div>
          <div>
            <p className="font-serif text-5xl text-[#1B3022]">{stats.count > 0 ? stats.count : "—"}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#5A665F]">Languages Listed</p>
          </div>
          <div>
            <p className="font-serif text-5xl text-[#B24A2D]">{fmtStat(stats.entries, "—")}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#5A665F]">Dictionary Entries</p>
          </div>
        </div>
      </section>

      {/* Featured Dialects */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:px-12">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-serif text-4xl text-[#1B3022]">Featured Dialects</h2>
          <Link href="/dialects" className="text-sm font-semibold uppercase tracking-wider text-[#8A3620] hover:underline">
            View All Dialects &rarr;
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {/* Maori */}
          <Link href="/mi?tab=dictionary" className="block">
            <div className="h-full overflow-hidden rounded-2xl border border-[#E3DFD6]/60 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="relative h-48 w-full">
                <Image src="/dialect-maori.png" alt="Māori Landscape" fill className="object-cover" />
              </div>
              <div className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-serif text-2xl text-[#1B3022]">Māori</h3>
                  <span className="rounded-full bg-[#E5F0E8] px-3 py-1 text-[10px] font-bold tracking-wider text-[#1B3022]">VITAL</span>
                </div>
                <p className="mb-6 text-sm leading-relaxed text-[#5A665F]">
                  Polynesia, New Zealand — Polynesian language family with mythologies and traditions.
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8A3620]">
                  <Volume2 className="h-4 w-4" /> 125k Speakers
                </div>
              </div>
            </div>
          </Link>

          {/* Gamilaraay */}
          <Link href="/gam?tab=dictionary" className="block">
            <div className="h-full overflow-hidden rounded-2xl border border-[#E3DFD6]/60 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="relative h-48 w-full">
                <Image src="/dialect-gamilaraay.png" alt="Gamilaraay Landscape" fill className="object-cover" />
              </div>
              <div className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-serif text-2xl text-[#1B3022]">Gamilaraay</h3>
                  <span className="rounded-full bg-[#FCE8E3] px-3 py-1 text-[10px] font-bold tracking-wider text-[#8A3620]">ENDANGERED</span>
                </div>
                <p className="mb-6 text-sm leading-relaxed text-[#5A665F]">
                  New South Wales, Australia — Indigenous language of the Gamilaraay people.
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8A3620]">
                  <Volume2 className="h-4 w-4" /> 3k Speakers
                </div>
              </div>
            </div>
          </Link>

          {/* Anishinaabe */}
          <Link href="/oj?tab=dictionary" className="block">
            <div className="h-full overflow-hidden rounded-2xl border border-[#E3DFD6]/60 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="relative h-48 w-full">
                <Image src="/dialect-anishinaabe.png" alt="Anishinaabe Landscape" fill className="object-cover" />
              </div>
              <div className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-serif text-2xl text-[#1B3022]">Anishinaabe</h3>
                  <span className="rounded-full bg-[#E8EFF5] px-3 py-1 text-[10px] font-bold tracking-wider text-[#2B4C6F]">VULNERABLE</span>
                </div>
                <p className="mb-6 text-sm leading-relaxed text-[#5A665F]">
                  Great Lakes Region — A group of culturally related indigenous peoples.
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8A3620]">
                  <Volume2 className="h-4 w-4" /> 50k Speakers
                </div>
              </div>
            </div>
          </Link>

          {/* Archive-mode UI preview (demo) */}
          <Link href="/arq" className="block">
            <div className="h-full overflow-hidden rounded-2xl border border-[#E3DFD6]/60 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="relative h-48 w-full opacity-90">
                <span className="absolute bottom-3 left-3 z-10 rounded-full bg-[#9AA199] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white shadow-sm">
                  Archive Only
                </span>
                <Image src="/dialect-maori.png" alt="Archive demo placeholder landscape" fill className="object-cover" />
              </div>
              <div className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-serif text-2xl text-[#1B3022]">Aruqa Archive (demo)</h3>
                  <span className="rounded-full bg-[#E8E8E6] px-3 py-1 text-[10px] font-bold tracking-wider text-[#5C5C5A]">
                    PREVIEW
                  </span>
                </div>
                <p className="mb-6 text-sm leading-relaxed text-[#5A665F]">
                  Sample language in archive mode: locked Learn tab with a coverage bar. Code{" "}
                  <span className="font-mono font-semibold text-[#1B3022]">arq</span>.
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8A3620]">
                  <BookOpen className="h-4 w-4" /> Try Learn tab — shows lock UI
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Storytelling Section */}
      <section className="relative overflow-hidden bg-[#121E16] text-[#F5F4F0]">
        <div className="pointer-events-none absolute right-0 top-0 h-[800px] w-[800px] opacity-5">
          <svg viewBox="0 0 100 100" className="h-full w-full fill-current">
            <path d="M50 0 C77.6 0 100 22.4 100 50 C100 77.6 77.6 100 50 100 C22.4 100 0 77.6 0 50 C0 22.4 22.4 0 50 0 Z M50 20 C33.4 20 20 33.4 20 50 C20 66.6 33.4 80 50 80 C66.6 80 80 66.6 80 50 C80 33.4 66.6 20 50 20 Z" />
          </svg>
        </div>
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:px-12 lg:grid-cols-2">
          <div className="group relative h-[500px] w-full overflow-hidden rounded-2xl">
            <Image src={mauiFishImage} alt="Elder Portrait" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/20" />
            <button
              type="button"
              className="absolute bottom-6 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#B24A2D] text-white shadow-lg transition-transform hover:scale-105"
            >
              <Play className="ml-1 h-6 w-6" fill="currentColor" />
            </button>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#8DB596]">Oral History Archives</p>
            <h2 className="mt-4 font-serif text-5xl leading-tight">The Legend of Maui&apos;s Fish</h2>
            <div className="mt-8 rounded-xl border border-[#2B4835] bg-[#1A2D21] p-8">
              <p className="font-serif text-lg italic leading-relaxed text-[#D2E0D6]">
                &ldquo;...and so he pulled, with the strength of the Atua themselves, until the great fish was free—its deep, firming the land we walk upon today. Listen to the cadence of the vowels. Let the land itself remember the ancestor&apos;s story.&rdquo;
              </p>
              <div className="mt-6 flex cursor-pointer items-center gap-3 text-sm font-semibold text-[#8DB596] transition-colors hover:text-white">
                <FileText className="h-4 w-4" />
                Read Full Transcript
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Living Dictionary & Features */}
      <section className="bg-[#FBF9F4] py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 md:px-12 lg:grid-cols-2">
          {/* Dictionary Card Mock */}
          <div className="relative rounded-3xl border border-[#E3DFD6]/60 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="absolute -left-4 -top-4 -z-10 h-24 w-24 rounded-full bg-[#FCE8E3]" />
            <div className="absolute -bottom-4 -right-4 -z-10 h-32 w-32 rounded-full bg-[#E5F0E8]" />

            <h3 className="mb-2 font-serif text-5xl text-[#1B3022]">Whānau</h3>
            <p className="mb-6 text-sm font-medium text-[#8A3620]">/fäˈnou/ • noun</p>

            <div className="mb-6 flex w-max items-center gap-3 rounded-full border border-[#E3DFD6] bg-[#F5F4F0] p-2 pr-6">
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B24A2D] text-white">
                <Volume2 className="h-5 w-5" />
              </button>
              <div className="h-1 w-24 rounded-full bg-[#D1C9B8]">
                <div className="h-full w-1/3 rounded-full bg-[#8A3620]" />
              </div>
            </div>

            <p className="leading-relaxed text-[#3A423D]">
              Extended family, family group, a person&apos;s immediate family. In modern terms, it includes those who are linked by a common purpose.
            </p>

            <div className="mt-6 flex gap-2">
              <span className="rounded-md bg-[#FCE8E3] px-2.5 py-1 text-[11px] font-bold text-[#B24A2D]">Noun</span>
              <span className="rounded-md bg-[#F5F4F0] px-2.5 py-1 text-[11px] font-bold text-[#5A665F]">Context</span>
            </div>
          </div>

          {/* Dictionary Info */}
          <div>
            <h2 className="mb-6 font-serif text-4xl text-[#1B3022]">The Living Dictionary</h2>
            <p className="mb-8 text-lg leading-relaxed text-[#5A665F]">
              Rather than a text-based dictionary, our archive is built on the living breath of speakers. Every word is anchored by its acoustic fingerprint, capturing the nuances, regional accents, and emotional weights that text alone can never convey.
            </p>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#B24A2D]" />
                <div>
                  <h4 className="font-bold text-[#1B3022]">Phonetic Integrity</h4>
                  <p className="mt-1 text-sm text-[#5A665F]">Audio-first mapping ensures pronunciation accuracy.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#B24A2D]" />
                <div>
                  <h4 className="font-bold text-[#1B3022]">Contextual Examples</h4>
                  <p className="mt-1 text-sm text-[#5A665F]">Hear words used in natural conversation and storytelling.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Community Voice & Learning Path */}
      <section className="mx-auto grid max-w-6xl items-start gap-12 px-6 py-20 md:px-12 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Community Voice */}
        <div>
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-serif text-3xl text-[#1B3022]">Community Voice</h2>
            <Link href="/?tab=community" className="text-sm font-semibold uppercase tracking-wider text-[#8A3620] hover:underline">
              Join &rarr;
            </Link>
          </div>
          <div className="space-y-6">
            <div className="flex gap-4 rounded-2xl border border-[#E3DFD6]/60 bg-white p-6 shadow-sm">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#D1C9B8]">
                <Image src="/hero-bg.png" alt="Avatar" fill className="object-cover" />
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-bold text-[#1B3022]">Ami Thorpe</span>
                  <span className="rounded bg-[#FCE8E3] px-2 py-0.5 text-[10px] font-bold text-[#B24A2D]">Polynesian</span>
                </div>
                <p className="text-sm italic text-[#5A665F]">
                  &ldquo;Just finished archiving my grandmother&apos;s lullabies. The Voice Print quality is incredible. Feeling connected.&rdquo;
                </p>
                <div className="mt-3 flex gap-4 text-xs font-semibold text-[#8C938E]">
                  <span>♡ 42</span>
                  <span>💬 5</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-[#E3DFD6]/60 bg-white p-6 shadow-sm">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#D1C9B8]">
                <Image src="/dialect-maori.png" alt="Avatar" fill className="object-cover" />
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-bold text-[#1B3022]">Olive Rangi</span>
                  <span className="rounded bg-[#E5F0E8] px-2 py-0.5 text-[10px] font-bold text-[#1B3022]">Māori</span>
                </div>
                <p className="text-sm italic text-[#5A665F]">
                  &ldquo;To speak it is to keep the ancestors alive. I invite the youth to join the discovering circle this Friday for our weekly chat!&rdquo;
                </p>
                <div className="mt-3 flex gap-4 text-xs font-semibold text-[#8C938E]">
                  <span>♡ 108</span>
                  <span>💬 24</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Path */}
        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-[#1A2D21] p-8 text-white">
          <div className="absolute -right-10 -top-10 opacity-10">
            <BookOpen className="h-40 w-40" />
          </div>
          <div className="relative z-10">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8DB596]">Learning Path</p>
            <h2 className="mb-8 font-serif text-3xl">Strengthen Your Roots</h2>

            <div className="mb-8 rounded-xl border border-[#2B4835] bg-[#243D2E] p-6">
              <div className="mb-4 flex items-end justify-between">
                <span className="text-sm font-semibold text-[#D2E0D6]">Fundamentals</span>
                <span className="text-[#8DB596]">▶</span>
              </div>
              <div className="flex justify-center py-6">
                <div className="text-center">
                  <h3 className="mb-2 font-serif text-4xl text-white">Kū</h3>
                  <div className="mx-auto h-1 w-12 rounded-full bg-[#B24A2D]" />
                </div>
              </div>
            </div>
          </div>
          <Link
            href="/mi?tab=learn"
            className="relative z-10 inline-flex w-full items-center justify-center rounded-full bg-[#B24A2D] py-6 text-center text-[13px] font-bold uppercase tracking-widest transition-colors hover:bg-[#8A3620]"
          >
            View My Path
          </Link>
        </div>
      </section>

      {/* Lend Your Voice */}
      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-12">
        <div className="relative flex flex-col items-center justify-between gap-12 overflow-hidden rounded-3xl bg-[#3E2916] p-10 md:flex-row md:p-16">
          <div className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 opacity-20 md:block">
            <div className="flex h-[400px] w-[400px] items-center justify-center rounded-full border border-white/20">
              <div className="flex h-[300px] w-[300px] items-center justify-center rounded-full border border-white/20">
                <div className="h-[200px] w-[200px] rounded-full border border-white/20" />
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-xl">
            <h2 className="mb-6 font-serif text-4xl text-[#FCE8E3] md:text-5xl">Lend Your Voice to History</h2>
            <p className="mb-8 leading-relaxed text-[#D1C9B8]">
              Every story shared is a thread in the tapestry of our survival. Use our high-fidelity recording tool to capture the words of your elders or your own learner&apos;s journey.
            </p>
            <Link
              href="/mi?tab=dictionary"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#B24A2D] px-8 py-6 text-sm font-bold text-white transition-colors hover:bg-[#8A3620]"
            >
              <Mic className="h-4 w-4" /> Record Audio Now
            </Link>
          </div>

          <div className="relative z-10 flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-[#B24A2D] shadow-2xl">
            <div className="flex items-center gap-2">
              <div className="h-8 w-2 animate-pulse rounded-full bg-white" />
              <div className="h-16 w-2 animate-pulse rounded-full bg-white [animation-delay:0.1s]" />
              <div className="h-10 w-2 animate-pulse rounded-full bg-white [animation-delay:0.2s]" />
              <div className="h-14 w-2 animate-pulse rounded-full bg-white [animation-delay:0.3s]" />
              <div className="h-6 w-2 animate-pulse rounded-full bg-white [animation-delay:0.4s]" />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="border-t border-[#E3DFD6]/60 bg-[#FBF9F4] py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 text-center md:grid-cols-3 md:px-12">
          <div className="flex flex-col items-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#FCE8E3] text-[#B24A2D]">
              <Mic className="h-6 w-6" />
            </div>
            <h4 className="mb-3 font-serif text-xl text-[#1B3022]">Archival Quality</h4>
            <p className="max-w-[250px] text-sm text-[#5A665F]">
              Lossless audio capture ensures that every syllable and breath is preserved for centuries to come.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#E5F0E8] text-[#1B3022]">
              <BookOpen className="h-6 w-6" />
            </div>
            <h4 className="mb-3 font-serif text-xl text-[#1B3022]">Contextual Etymology</h4>
            <p className="max-w-[250px] text-sm text-[#5A665F]">
              We don&apos;t just translate words; we archive the culture, history, and family lineage behind them.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#E3DFD6] bg-[#F5F4F0] text-[#5A665F]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h4 className="mb-3 font-serif text-xl text-[#1B3022]">Community Safety</h4>
            <p className="max-w-[250px] text-sm text-[#5A665F]">
              Community-led moderation ensures that sacred knowledge is shared with the respect it deserves.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
