"use client";

import ForumPanel from "@/components/forum/ForumPanel";
import PoetryGallery from "@/components/poetry/PoetryGallery";
import StoryLibrary from "@/components/storytelling/StoryLibrary";
import { cn } from "@/lib/utils";

export type HubSection = "forum" | "poetry" | "storytelling";

const NAV: Array<{ key: HubSection; label: string }> = [
  { key: "forum", label: "Forum" },
  { key: "poetry", label: "Poetry" },
  { key: "storytelling", label: "Storytelling" },
];

/** `queryString` is the raw `window.location.search` segment (leading `?` optional) preserved for SSR-safe links from the tab shell. */
export default function CommunityHub({
  languageCode,
  section: sectionProp,
  queryString,
}: {
  languageCode: string;
  section: string | null;
  /** e.g. `tab=community&section=forum` — passed from server so SSR links remain consistent. */
  queryString?: string;
}) {
  const raw = (sectionProp || "forum").toLowerCase();
  const section: HubSection =
    raw === "poetry" || raw === "storytelling" || raw === "forum" ? (raw as HubSection) : "forum";

  const baseSearch = queryString?.startsWith("?") ? queryString.slice(1) : queryString || "";

  const hrefWith = (s: HubSection) => {
    const params = new URLSearchParams(baseSearch || `tab=community&section=forum`);
    params.set("tab", "community");
    params.set("section", s);
    return `/${languageCode}?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2 rounded-full border border-[#C3C8C1]/35 bg-[#F5F3EE] p-2" aria-label="Community sections">
        {NAV.map(({ key, label }) => (
          <a
            key={key}
            href={hrefWith(key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              section === key ? "bg-[#1B3022] text-white" : "text-[#434843] hover:bg-[#E8EFE9]"
            )}
          >
            {label}
          </a>
        ))}
      </nav>

      {section === "forum" ? <ForumPanel languageCode={languageCode} /> : null}
      {section === "poetry" ? <PoetryGallery languageCode={languageCode} /> : null}
      {section === "storytelling" ? <StoryLibrary languageCode={languageCode} /> : null}
    </div>
  );
}
