import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "dictionary", label: "Dictionary" },
  { id: "community", label: "Community" },
  { id: "chatrooms", label: "Chatrooms" },
  { id: "learning", label: "Learning" },
] as const;

type Props = {
  activeTab: string;
  languageCode?: string;
};

export default function TopBar({ activeTab, languageCode }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#C3C8C1]/20 bg-[#1B3022] text-[#D0E9D4]">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-serif text-3xl text-white">
            LangLegacy
          </Link>
          <nav className="flex items-center gap-1" aria-label="Primary">
            {TABS.map((tab) => {
              const href = languageCode ? `/${languageCode}?tab=${tab.id}` : `/?tab=${tab.id}`;
              return (
                <Link
                  key={tab.id}
                  href={href}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-all active:scale-[0.98]",
                    activeTab === tab.id ? "bg-[#B4CDB8] text-[#0B2013]" : "text-[#D0E9D4] hover:bg-[#30483A]"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center rounded-full border border-[#C3C8C1]/20 bg-[#31493B] px-4 py-2 text-sm text-[#B4CDB8]">
            Search dictionary...
          </div>
          <span className="grid h-9 w-9 place-content-center rounded-full border border-[#C3C8C1]/30 text-lg">○</span>
        </div>
      </div>
    </header>
  );
}
