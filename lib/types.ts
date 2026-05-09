export type Language = {
  _id: string;
  type?: "language";
  name: string;
  code: string;
  region: string | null;
  description?: string | null;
  native_script?: string | null;
  /** Approximate speakers (optional enrichment for cards). */
  speaker_count?: number | null;
  entry_count: number;
  translated_entry_count?: number;
  /** 0–1 fraction of entries with usable English translations. */
  translation_coverage?: number;
  /** `archive`: Learn locked until coverage thresholds; `full`: normal experience. */
  mode?: "archive" | "full";
  /** When true, PATCH from moderators pinned `mode` until cleared. */
  moderator_mode_lock?: boolean;
  contributor_count?: number;
  created_at: string;
  updated_at?: string | null;
};

export type Entry = {
  _id: string;
  type?: "entry";
  language_code: string;
  word: string;
  translation: string;
  definition: string | null;
  audio_url: string | null;
  contributor_id: string | null;
  contributor_name: string | null;
  report_count: number;
  status: "active" | "removed" | "under_review";
  created_at: string;
  phonetic?: string | null;
  part_of_speech?: string | null;
  example_sentence?: string | null;
  example_translation?: string | null;
  source?: "archive" | "community";
};

export type ExtractedEntry = {
  word: string;
  translation: string;
  definition?: string | null;
  phonetic?: string | null;
  part_of_speech?: string | null;
  example_sentence?: string | null;
  example_translation?: string | null;
};

export type UserRole = "user" | "moderator" | "admin";

export type User = {
  _id: string;
  type?: "user";
  name: string;
  email: string | null;
  role: UserRole;
  created_at: string;
};

/** Legacy + COMMUNITY.md report reasons */
export type ReportReason =
  | "inaccurate"
  | "offensive"
  | "spam"
  | "other"
  | "inaccurate_translation"
  | "offensive_content"
  | "incorrect_audio";

export type ModerationStatus = "active" | "under_review" | "removed";

/** COMMUNITY hub forum thread (stored in Cloudant `posts`). */
export type ForumSection = "forum";

export type Post = {
  _id: string;
  type?: "post";
  section?: ForumSection;
  language_code: string;
  author_id: string;
  author_name: string;
  body: string;
  audio_url?: string | null;
  parent_id?: string | null;
  root_id?: string | null;
  depth?: number;
  /** @deprecated use parent_id */
  parent_post_id?: string | null;
  reply_to_author?: string | null;
  reactions?: Record<string, number>;
  reaction_users?: Record<string, string[]>;
  report_count?: number;
  status?: ModerationStatus;
  created_at: string;
};

/** COMMUNITY poetry DB */
export type Poem = {
  _id: string;
  type?: "poem";
  language_code: string;
  title: string;
  author_name: string;
  author_id?: string;
  body_original: string;
  body_translation: string;
  audio_url: string | null;
  reactions: Record<string, string[]>;
  report_count?: number;
  status?: ModerationStatus;
  created_at: string;
};

/** COMMUNITY stories DB */
export type Story = {
  _id: string;
  type?: "story";
  language_code: string;
  title: string;
  author_name: string;
  author_id?: string;
  description: string;
  audio_url: string | null;
  transcript: string;
  transcript_translation: string;
  duration_seconds: number;
  tags: string[];
  reactions: Record<string, string[]>;
  report_count?: number;
  status?: ModerationStatus;
  created_at: string;
};

export type Room = {
  _id: string;
  type?: "room";
  language_code: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
};

export type Message = {
  _id: string;
  type?: "message";
  room_id: string;
  language_code: string;
  author_id: string;
  author_name: string;
  body: string;
  report_count: number;
  status: ModerationStatus;
  created_at: string;
};

export type ReportTargetType = "entry" | "post" | "message" | "poem" | "story";

export type ReportStatus =
  | "open"
  | "resolved_removed"
  | "resolved_kept"
  | "pending"
  | "removed"
  | "dismissed";

export type Report = {
  _id: string;
  type?: "report";
  target_type?: ReportTargetType;
  target_id?: string;
  /** COMMUNITY.md canonical target reference */
  content_type?: ReportTargetType;
  content_id?: string;
  language_code: string;
  reporter_id: string;
  reason: ReportReason;
  details?: string | null;
  note?: string | null;
  status: ReportStatus;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
};

export type LearningSession = {
  _id: string;
  type?: "learning_session";
  user_id: string;
  language_code: string;
  cards_seen: number;
  cards_correct: number;
  duration_seconds: number;
  created_at: string;
};

export type LearningProgress = {
  _id: string;
  type?: "learning_progress";
  user_id: string;
  language_code: string;
  total_sessions: number;
  total_correct: number;
  total_seen: number;
  streak_days: number;
  last_session_at: string;
};
