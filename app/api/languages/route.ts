import { NextRequest, NextResponse } from "next/server";
import { getAllDocuments, getDocument, putDocument } from "@/lib/cloudant";
import type { Language } from "@/lib/types";

export const dynamic = "force-dynamic";

function coerceLanguage(raw: Record<string, unknown>): Language {
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
    contributor_count:
      typeof raw.contributor_count === "number" ? raw.contributor_count : 0,
    created_at: typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : null,
  };
}

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
    contributor_count: 0,
    created_at: "2026-05-08T00:00:00Z",
    updated_at: null,
  },
];

export async function GET() {
  try {
    const raw = (await getAllDocuments("languages")) as Record<string, unknown>[];
    const languages = raw.map(coerceLanguage).sort((a, b) => a.name.localeCompare(b.name));
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
