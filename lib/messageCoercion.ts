import type { Message } from "@/lib/types";

/**
 * Normalize Cloudant / legacy payloads into a `Message` the UI can render.
 * Older or hand-edited docs may use alternate field names.
 */
export function coerceMessage(raw: Record<string, unknown>): Message {
  const body =
    (typeof raw.body === "string" && raw.body) ||
    (typeof raw.text === "string" && raw.text) ||
    (typeof raw.message === "string" && raw.message) ||
    (typeof raw.content === "string" && raw.content) ||
    "";

  const author_name =
    (typeof raw.author_name === "string" && raw.author_name.trim() && raw.author_name) ||
    (typeof raw.author === "string" && raw.author.trim() && raw.author) ||
    (typeof raw.display_name === "string" && raw.display_name.trim() && raw.display_name) ||
    "";

  const author_id =
    typeof raw.author_id === "string" && raw.author_id.trim() ? raw.author_id.trim() : "unknown";

  const created_at =
    (typeof raw.created_at === "string" && raw.created_at) ||
    (typeof raw.time === "string" && raw.time) ||
    new Date(0).toISOString();

  const room_id = typeof raw.room_id === "string" ? raw.room_id : "";
  const language_code = typeof raw.language_code === "string" ? raw.language_code : "";

  const report_count = typeof raw.report_count === "number" ? raw.report_count : 0;
  const status =
    raw.status === "removed" || raw.status === "under_review" || raw.status === "active"
      ? raw.status
      : "active";

  return {
    _id: typeof raw._id === "string" ? raw._id : "",
    type: raw.type === "message" ? "message" : undefined,
    room_id,
    language_code,
    author_id,
    author_name,
    body,
    report_count,
    status,
    created_at,
  };
}
