export type Language = {
  _id: string;
  type?: "language";
  name: string;
  code: string;
  region: string | null;
  speaker_count: number | null;
  entry_count: number;
  created_at: string;
};

export type Entry = {
  _id: string;
  type?: "entry";
  language_code: string;
  word: string;
  phonetic: string | null;
  translation: string;
  part_of_speech: string | null;
  example_sentence: string | null;
  example_translation: string | null;
  audio_url: string | null;
  source: "archive" | "community";
  created_at: string;
};

export type ExtractedEntry = Omit<
  Entry,
  "_id" | "audio_url" | "source" | "created_at" | "language_code" | "type"
>;
