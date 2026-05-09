import type { ModerationStatus, Post } from "@/lib/types";

function coerceReactionFields(raw: Record<string, unknown>): {
  reactions: Record<string, number>;
  reaction_users: Record<string, string[]>;
} {
  const rawUsers =
    typeof raw.reaction_users === "object" && raw.reaction_users !== null
      ? (raw.reaction_users as Record<string, unknown>)
      : {};

  const reaction_users: Record<string, string[]> = {};
  for (const [emoji, ids] of Object.entries(rawUsers)) {
    if (Array.isArray(ids))
      reaction_users[emoji] = ids.filter((x): x is string => typeof x === "string");
  }

  const rawReacts = raw.reactions;
  if (typeof rawReacts === "object" && rawReacts !== null && !Array.isArray(rawReacts)) {
    for (const [emoji, val] of Object.entries(rawReacts as Record<string, unknown>)) {
      if (Array.isArray(val)) {
        reaction_users[emoji] = val.filter((x): x is string => typeof x === "string");
      }
    }
  }

  const reactions: Record<string, number> = {};
  for (const [emoji, ids] of Object.entries(reaction_users)) {
    reactions[emoji] = ids.length;
  }

  if (typeof rawReacts === "object" && rawReacts !== null && !Array.isArray(rawReacts)) {
    for (const [emoji, val] of Object.entries(rawReacts as Record<string, unknown>)) {
      if (typeof val === "number") reactions[emoji] = val;
    }
    for (const [emoji, val] of Object.entries(rawReacts as Record<string, unknown>)) {
      if (Array.isArray(val)) reactions[emoji] = val.filter((x) => typeof x === "string").length;
    }
  }

  return { reactions, reaction_users };
}

/** Normalize legacy + COMMUNITY forum post documents for the UI. */
export function normalizeForumPost(raw: Record<string, unknown>): Post {
  const { reactions, reaction_users } = coerceReactionFields(raw);

  const parent_id =
    (typeof raw.parent_id === "string" ? raw.parent_id : null) ||
    (typeof raw.parent_post_id === "string" ? raw.parent_post_id : null);

  const depth =
    typeof raw.depth === "number" ? raw.depth : parent_id ? 1 : 0;

  let root_id: string | null =
    typeof raw.root_id === "string" ? raw.root_id : null;
  if (!root_id && parent_id) root_id = parent_id;

  return {
    _id: String(raw._id),
    type: raw.type === "post" ? "post" : undefined,
    section: "forum",
    language_code: String(raw.language_code || ""),
    author_id: String(raw.author_id || ""),
    author_name: String(raw.author_name || ""),
    body: String(raw.body || ""),
    audio_url: typeof raw.audio_url === "string" ? raw.audio_url : null,
    parent_id,
    root_id,
    depth,
    parent_post_id: typeof raw.parent_post_id === "string" ? raw.parent_post_id : parent_id,
    reply_to_author: typeof raw.reply_to_author === "string" ? raw.reply_to_author : null,
    reactions,
    reaction_users,
    report_count: typeof raw.report_count === "number" ? raw.report_count : 0,
    status: (typeof raw.status === "string" ? raw.status : "active") as ModerationStatus,
    created_at: typeof raw.created_at === "string" ? raw.created_at : new Date(0).toISOString(),
  };
}

export function reactionCountsForUi(post: Post): Record<string, number> {
  if (post.reaction_users && Object.keys(post.reaction_users).length > 0) {
    const out: Record<string, number> = {};
    for (const [emoji, ids] of Object.entries(post.reaction_users)) {
      out[emoji] = Array.isArray(ids) ? ids.length : 0;
    }
    return out;
  }
  const out: Record<string, number> = {};
  if (post.reactions) {
    for (const [k, v] of Object.entries(post.reactions)) {
      out[k] = typeof v === "number" ? v : 0;
    }
  }
  return out;
}
