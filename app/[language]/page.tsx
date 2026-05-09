import Link from "next/link";
import AppNav from "@/components/AppNav";
import { getDocument } from "@/lib/cloudant";
import type { Language } from "@/lib/types";
import DictionaryClient from "./DictionaryClient";

export default async function LanguageDictionaryPage({
  params,
  searchParams,
}: {
  params: { language: string };
  searchParams?: { tab?: string };
}) {
  const languageDoc = (await getDocument("languages", params.language)) as Language | null;
  const dictionaryTitle = languageDoc?.name ? `${languageDoc.name} Dictionary` : `${params.language} Dictionary`;
  const activeTab = (searchParams?.tab || "dictionary").toLowerCase();
  const tabs = [
    { id: "dictionary", label: "Dictionary" },
    { id: "community", label: "Community" },
    { id: "chatrooms", label: "Chatrooms" },
    { id: "learning", label: "Learning" },
  ];

  return (
    <div className="-mx-4 -mt-6 min-h-screen bg-[#F3F1ED] text-[#1F2E27]">
      <style jsx global>{`
        body {
          background: #f3f1ed;
          color: #1f2e27;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        }
        main {
          max-width: none !important;
          padding: 0 !important;
        }
        main > header {
          display: none !important;
        }
      `}</style>

      <section className="bg-[#153D31] px-8 py-5 text-[#F4EEE5]">
        <div className="mx-auto max-w-6xl">
          <AppNav />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {tabs.map((tab) => {
              const href = `/${params.language}?tab=${tab.id}`;
              const isActive = activeTab === tab.id || (tab.id === "dictionary" && !searchParams?.tab);
              return (
                <Link
                  key={tab.id}
                  href={href}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                    isActive ? "bg-[#E9E2D5] text-[#1F2E27]" : "bg-[#234C3F] text-[#D9D0C3] hover:bg-[#2B5A4B]"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-10 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="space-y-3 text-center">
            <h1 className="font-serif text-5xl text-[#101A15]">{dictionaryTitle}</h1>
            <p className="mx-auto max-w-2xl text-[#4F5E56]">
              Explore the living breath of {languageDoc?.region || "our communities"}. Search for words, phrases, and concepts within our
              community-driven archive.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <DictionaryClient languageCode={params.language} />
          <div className="mt-4 rounded-2xl bg-[#1D3D2F] p-6 text-[#F3EEE4] md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="rounded bg-[#C4622D] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                Dialect Spotlight
              </span>
              <Link
                href={`/${params.language}/contribute`}
                className="rounded-full bg-[#C4622D] px-5 py-2 text-sm font-semibold text-white hover:bg-[#B35522]"
              >
                Contribute a Word
              </Link>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div>
                <h2 className="font-serif text-4xl">Preserving {languageDoc?.region || "Regional"} Dialects</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#D9D0C3]">
                  Language memory shifts from valley to coast, village to city. Explore oral histories and recordings that keep regional
                  vocabulary alive.
                </p>
                <Link
                  href={`/${params.language}`}
                  className="mt-6 inline-block rounded-full bg-[#F4EEE5] px-5 py-2 text-sm font-semibold text-[#1F2E27]"
                >
                  Explore Archive
                </Link>
              </div>
              <div className="h-48 rounded-xl bg-gradient-to-br from-[#5A5E62] via-[#2C3236] to-[#0F1418]" />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E2DACE] bg-[#F3F1ED] px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-[#59665E]">
          <p>
            <span className="font-serif text-2xl text-[#101A15]">LangLegacy</span>
            <br />© 2024 LangLegacy. Preserving the breath of our ancestors.
          </p>
          <div className="flex items-center gap-6 text-xs">
            <span>Archives</span>
            <span>Linguists</span>
            <span>Safety</span>
            <span>Terms</span>
          </div>
          <button type="button" className="rounded-full bg-[#C4622D] px-6 py-2 font-semibold text-white">
            Join the Circle
          </button>
        </div>
      </div>
      <style jsx global>{`
        .panel {
          border-radius: 16px;
          border: 1px solid #e3dbcf;
          background: #fbfaf8;
          padding: 16px;
          box-shadow: 0 1px 1px rgba(18, 32, 26, 0.02);
        }
        .panel h3 {
          font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
          font-size: 2rem;
          line-height: 1.1;
          color: #132119;
        }
        .panel span.rounded.bg-slate-700 {
          background: #dcedde !important;
          color: #2a5a45 !important;
          text-transform: capitalize;
        }
        .panel span.rounded.bg-slate-800 {
          background: #f0ece5 !important;
          color: #626d66 !important;
        }
        .panel .text-slate-300,
        .panel .text-slate-400 {
          color: #6d776f !important;
        }
        .panel .text-sm.italic {
          color: #85381f !important;
        }
        .space-y-3 > .panel {
          border: 1px solid #dad2c7;
          background: #f9f7f4;
        }
        .space-y-3 > .panel input {
          border: 1px solid #d7d0c5 !important;
          background: #f7f4ef !important;
          color: #18261f !important;
          border-radius: 0.5rem !important;
          padding: 0.85rem 1rem !important;
        }
        .space-y-3 > .panel button {
          background: #c4622d !important;
          color: #fff !important;
          border-radius: 9999px !important;
        }
        .space-y-3 > .grid.gap-3 {
          display: grid;
          gap: 1rem;
          grid-template-columns: 1fr;
        }
        @media (min-width: 900px) {
          .space-y-3 > .grid.gap-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
