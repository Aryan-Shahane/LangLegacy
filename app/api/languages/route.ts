import { NextRequest, NextResponse } from "next/server";
import { getAllDocuments, getDocument, putDocument } from "@/lib/cloudant";
import type { Language } from "@/lib/types";

export const dynamic = "force-dynamic";

function coerceLanguage(raw: Record<string, unknown>): Language {
  const storedMode =
    raw.mode === "full" || raw.mode === "archive" ? (raw.mode as "full" | "archive") : undefined;
  const coverage =
    typeof raw.translation_coverage === "number" ? raw.translation_coverage : undefined;
  const mode: "archive" | "full" = storedMode ?? "archive";

  return {
    _id: String(raw._id),
    type: raw.type === "language" ? "language" : undefined,
    name: String(raw.name || ""),
    code: String(raw.code || raw._id || ""),
    region: typeof raw.region === "string" ? raw.region : null,
    description: typeof raw.description === "string" ? raw.description : raw.description === null ? null : undefined,
    native_script: typeof raw.native_script === "string" ? raw.native_script : undefined,
    speaker_count: typeof raw.speaker_count === "number" ? raw.speaker_count : null,
    entry_count: typeof raw.entry_count === "number" ? raw.entry_count : 0,
    translated_entry_count: typeof raw.translated_entry_count === "number" ? raw.translated_entry_count : undefined,
    translation_coverage: coverage,
    mode,
    moderator_mode_lock: raw.moderator_mode_lock === true,
    contributor_count:
      typeof raw.contributor_count === "number" ? raw.contributor_count : 0,
    created_at: typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : null,
  };
}

/** Merged into GET when not in Cloudant; use `/arq` + Learn tab to preview archive lock UI. */
export const ARCHIVE_DEMO_LANGUAGE: Language = {
  _id: "arq",
  type: "language",
  name: "Aruqa Archive (demo)",
  code: "arq",
  region: "Demo · fictional",
  description: "Open /arq → Learn tab to see archive lock + coverage bar.",
  native_script: "Latin",
  speaker_count: null,
  entry_count: 300,
  translated_entry_count: 102,
  translation_coverage: 0.34,
  mode: "archive",
  contributor_count: 6,
  created_at: "2026-05-08T00:00:00Z",
  updated_at: "2026-05-09T00:00:00Z",
};

const FALLBACK_LANGUAGES: Language[] = [
  {
    _id: "mi",
    type: "language",
    name: "Māori",
    code: "mi",
    region: "New Zealand",
    description: "Polynesian language of the Māori people",
    native_script: "Latin",
    speaker_count: null,
    entry_count: 0,
    translated_entry_count: 0,
    translation_coverage: 0,
    mode: "archive",
    contributor_count: 0,
    created_at: "2026-05-08T00:00:00Z",
    updated_at: null,
  },
  {
    _id: "cy",
    type: "language",
    name: "Welsh",
    code: "cy",
    region: "Wales",
    description: null,
    native_script: "Latin",
    speaker_count: null,
    entry_count: 0,
    translated_entry_count: 0,
    translation_coverage: 0,
    mode: "archive",
    contributor_count: 0,
    created_at: "2026-05-08T00:00:00Z",
    updated_at: null,
  },
  {
    _id: "kw",
    type: "language",
    name: "Cornish",
    code: "kw",
    region: "Cornwall",
    description: null,
    native_script: "Latin",
    speaker_count: null,
    entry_count: 0,
    translated_entry_count: 0,
    translation_coverage: 0,
    mode: "archive",
    contributor_count: 0,
    created_at: "2026-05-08T00:00:00Z",
    updated_at: null,
  },
  ARCHIVE_DEMO_LANGUAGE,
];

export async function GET() {
  try {
    const raw = (await getAllDocuments("languages")) as Record<string, unknown>[];
    const languages = raw.map(coerceLanguage);
    if (!languages.some((l) => l.code === ARCHIVE_DEMO_LANGUAGE.code)) {
      languages.push(ARCHIVE_DEMO_LANGUAGE);
    }
    languages.sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json(languages);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch languages";
    if (message.includes("401") || message.includes("Missing Cloudant credentials")) {
      return NextResponse.json(FALLBACK_LANGUAGES);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      code?: string;
      region?: string;
      description?: string;
      native_script?: string;
      sample_greeting?: string;
    };

    const name = (body.name || "").trim();
    const code = (body.code || "").trim().toLowerCase();
    const region = (body.region || "").trim();
    let description = body.description?.trim() || null;
    if (body.sample_greeting?.trim()) {
      const greet = body.sample_greeting.trim();
      description = description ? `${description}\n\nSample greeting: ${greet}` : `Sample greeting: ${greet}`;
    }

    if (!name || !code || !region) {
      return NextResponse.json({ error: "Language name, code, and region are required." }, { status: 400 });
    }

    const existing = await getDocument("languages", code);
    if (existing) {
      return NextResponse.json({ error: "A language with this code already exists." }, { status: 409 });
    }

    const now = new Date().toISOString();
    const doc: Language = {
      _id: code,
      type: "language",
      name,
      code,
      region,
      description,
      native_script: body.native_script?.trim() || null,
      speaker_count: null,
      entry_count: 0,
      translated_entry_count: 0,
      translation_coverage: 0,
      mode: "archive",
      moderator_mode_lock: false,
      contributor_count: 0,
      created_at: now,
      updated_at: null,
    };

    await putDocument("languages", code, doc as unknown as Record<string, unknown>);
    return NextResponse.json(coerceLanguage(doc as unknown as Record<string, unknown>));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create language" },
      { status: 500 }
    );
  }
}
