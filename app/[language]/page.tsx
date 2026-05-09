import Link from "next/link";
import { getSessionFromCookie } from "@/lib/auth";
import { getDocument } from "@/lib/cloudant";
import type { Language } from "@/lib/types";
import LanguageTabsPanel from "@/components/LanguageTabsPanel";

export default async function LanguageDictionaryPage({
  params,
  searchParams,
}: {
  params: { language: string };
  searchParams?: { tab?: string };
}) {
  const languageDoc = (await getDocument("languages", params.language)) as Language | null;
  const viewer = await getSessionFromCookie();
  const dictionaryTitle = languageDoc?.name ? `${languageDoc.name} Dictionary` : `${params.language} Dictionary`;
  const activeTab = (searchParams?.tab || "dictionary").toLowerCase();
  const tabs = [
    { id: "dictionary", label: "Dictionary" },
    { id: "community", label: "Community" },
    { id: "chatrooms", label: "Chatrooms" },
    { id: "learning", label: "Learning" },
  ];

  return (
    <div className="-mx-4 -mt-6 min-h-screen bg-[#F3F1ED] text-[#18261F]">
      <style jsx global>{`
        body {
          background: #f3f1ed;
          color: #18261f;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        }
        main {
          max-width: none !important;
          padding: 0 !important;
        }
        main > header {
          display: none !important;
        }
        nav[aria-label="Language sections"] {
          display: none !important;
        }
      `}</style>

      <header className="bg-[#153D31] px-8 py-4 text-[#F4EEE5]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-10">
            <Link href="/" className="font-serif text-4xl tracking-tight text-[#F4EEE5]">
              LangLegacy
            </Link>
            <nav className="flex items-center gap-2" aria-label="Dictionary tabs">
              {tabs.map((tab) => {
                const href = `/${params.language}?tab=${tab.id}`;
                const isActive = activeTab === tab.id || (tab.id === "dictionary" && !searchParams?.tab);
                return (
                  <Link
                    key={tab.id}
                    href={href}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      isActive ? "bg-[#D9E2D8] text-[#1C3127]" : "text-[#E3DACA] hover:bg-[#1F4A3A]"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-[280px] items-center gap-2 rounded-full bg-[#204738] px-4 text-sm text-[#B8C4BC]">
              <span aria-hidden>⌕</span>
              <span>Search dictionary...</span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#89A093] text-lg text-[#E3DACA]">
              ○
            </div>
          </div>
        </div>
      </header>

      <section className="px-6 py-10 md:px-12">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="font-serif text-5xl text-[#111B16]">{dictionaryTitle}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[#4E5E56]">
            Explore the living breath of {languageDoc?.region || "our communities"}. Search for words, phrases, and concepts within our
            community-driven archive.
          </p>
        </div>
      </section>

      <section className="px-6 pb-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <LanguageTabsPanel languageCode={params.language} viewerRole={viewer?.role || "user"} />
        </div>
      </section>
    </div>
  );
}
