import type { Entry } from "@/lib/types";

/** Same catalog as `GET /api/entries` when Cloudant is empty or unavailable (first page). */
export const FALLBACK_DICTIONARY_ENTRIES: Record<string, Entry[]> = {
  mi: [
    {
      _id: "m1",
      type: "entry",
      language_code: "mi",
      word: "Kia ora",
      translation: "Hello / Thank you / Cheers",
      definition: "A Māori greeting with a variety of meanings.",
      audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
      contributor_id: "system",
      contributor_name: "Archive",
      report_count: 0,
      status: "active",
      created_at: new Date().toISOString(),
    },
    {
      _id: "m2",
      type: "entry",
      language_code: "mi",
      word: "Aotearoa",
      translation: "New Zealand",
      definition: "The Māori name for New Zealand, literally 'Land of the Long White Cloud'.",
      audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
      contributor_id: "system",
      contributor_name: "Archive",
      report_count: 0,
      status: "active",
      created_at: new Date().toISOString(),
    },
  ],
  cy: [
    {
      _id: "c1",
      type: "entry",
      language_code: "cy",
      word: "Hiraeth",
      translation: "Longing / Homesickness",
      definition: "A deep longing for a home, place or time that you can't return to.",
      audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
      contributor_id: "system",
      contributor_name: "Archive",
      report_count: 0,
      status: "active",
      created_at: new Date().toISOString(),
    },
  ],
  kw: [
    {
      _id: "k1",
      type: "entry",
      language_code: "kw",
      word: "Kernow",
      translation: "Cornwall",
      definition: "The Cornish name for the county of Cornwall.",
      audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
      contributor_id: "system",
      contributor_name: "Archive",
      report_count: 0,
      status: "active",
      created_at: new Date().toISOString(),
    },
  ],
};

export function getFallbackDictionaryEntries(languageCode: string): Entry[] {
  const key = languageCode.trim().toLowerCase();
  return FALLBACK_DICTIONARY_ENTRIES[key] ?? [];
}
