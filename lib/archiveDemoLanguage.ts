import type { Language } from "@/lib/types";

/** Merged into GET /api/languages when missing in Cloudant; `/arq` Learn tab demos archive UX. */
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
  audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
};
