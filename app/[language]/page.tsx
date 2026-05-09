import Link from "next/link";
import { getSessionFromCookie } from "@/lib/auth";
import SiteFooter from "@/components/SiteFooter";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDocument } from "@/lib/cloudant";
import type { Language } from "@/lib/types";
import LanguageTabsPanel from "@/components/LanguageTabsPanel";

export default async function LanguageDictionaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ language: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { language } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const languageDoc = (await getDocument("languages", language)) as Language | null;
  const viewer = await getSessionFromCookie();
  const dictionaryTitle = languageDoc?.name ? `${languageDoc.name} Dictionary` : `${language} Dictionary`;
  const activeTab = (resolvedSearchParams?.tab || "dictionary").toLowerCase();
  const tabs = [
    { id: "dictionary", label: "Dictionary" },
    { id: "community", label: "Community" },
    { id: "chatrooms", label: "Chatrooms" },
    { id: "learning", label: "Learning" },
  ];

  return (
    <div className="min-h-screen bg-[#FBF9F4] text-[#1B1C19]">
      <TopBar activeTab={activeTab} languageCode={language} />

      <section className="px-6 py-12 md:px-12">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="font-serif text-5xl text-[#061B0E]">{dictionaryTitle}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[#434843]">
            Explore the living breath of {languageDoc?.region || "our communities"}. Search for words, phrases, and concepts within our
            community-driven archive.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label="Dictionary tabs">
            {tabs.map((tab) => {
              const href = `/${language}?tab=${tab.id}`;
              const isActive = activeTab === tab.id || (tab.id === "dictionary" && !resolvedSearchParams?.tab);
              return (
                <Link key={tab.id} href={href}>
                  <Button variant={isActive ? "pill" : "outline"} size="sm">
                    {tab.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <LanguageTabsPanel languageCode={language} viewerRole={viewer?.role || "user"} />
          <Card className="mt-6 grid gap-4 bg-[#1B3022] p-6 text-[#D0E9D4] md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#B4CDB8]">Dialect Spotlight</p>
              <h2 className="mt-3 font-serif text-4xl text-white">Preserving {languageDoc?.region || "Regional"} Dialects</h2>
              <p className="mt-3 max-w-xl text-sm text-[#D0E9D4]/85">
                Explore oral histories and place-based pronunciation traditions that keep ancestral language forms alive.
              </p>
              <Link href={`/${language}`} className="mt-4 inline-block">
                <Button variant="outline" className="border-white/30 bg-white text-[#1B3022] hover:bg-[#F0EEE9]">
                  Explore Archive
                </Button>
              </Link>
            </div>
            <div className="h-52 rounded-xl bg-gradient-to-br from-[#5A5E62] via-[#2C3236] to-[#0F1418]" />
          </Card>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
