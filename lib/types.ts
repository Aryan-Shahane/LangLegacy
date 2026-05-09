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

export type UserRole = "user" | "moderator" | "admin";

export type User = {
  _id: string;
  type?: "user";
  name: string;
  email: string | null;
  role: UserRole;
  created_at: string;
};

export type ReportReason = "inaccurate" | "offensive" | "spam" | "other";

export type ModerationStatus = "active" | "under_review" | "removed";

export type Post = {
  _id: string;
  type?: "post";
  language_code: string;
  author_id: string;
  author_name: string;
  body: string;
  audio_url: string | null;
  reactions: Record<string, number>;
  reaction_users?: Record<string, string[]>;
  report_count: number;
  status: ModerationStatus;
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

export type ReportTargetType = "entry" | "post" | "message";
export type ReportStatus = "open" | "resolved_removed" | "resolved_kept";

export type Report = {
  _id: string;
  type?: "report";
  target_type: ReportTargetType;
  target_id: string;
  language_code: string;
  reporter_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: string | null;
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
