import { NextResponse } from "next/server";
import { getAllDocuments } from "@/lib/cloudant";
import type { Language } from "@/lib/types";

export const dynamic = "force-dynamic";

const FALLBACK_LANGUAGES: Language[] = [
  {
    _id: "mi",
    type: "language",
    name: "Maori",
    code: "mi",
    region: "New Zealand",
    speaker_count: 50000,
    entry_count: 0,
    created_at: "2026-05-08T00:00:00Z",
  },
  {
    _id: "cy",
    type: "language",
    name: "Welsh",
    code: "cy",
    region: "Wales",
    speaker_count: 600000,
    entry_count: 0,
    created_at: "2026-05-08T00:00:00Z",
  },
  {
    _id: "kw",
    type: "language",
    name: "Cornish",
    code: "kw",
    region: "Cornwall",
    speaker_count: 3000,
    entry_count: 0,
    created_at: "2026-05-08T00:00:00Z",
  },
];

export async function GET() {
  try {
    const languages = (await getAllDocuments("languages")) as Language[];
    return NextResponse.json(languages.sort((a, b) => a.name.localeCompare(b.name)));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch languages";
    if (message.includes("401") || message.includes("Missing Cloudant credentials")) {
      return NextResponse.json(FALLBACK_LANGUAGES);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
