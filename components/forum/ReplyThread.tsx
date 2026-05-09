import type { Post } from "@/lib/types";

/** Group forum posts into roots + O(1) child lookup by parent `_id`. */
export function organizeForumPosts(posts: Post[]): {
  roots: Post[];
  getChildren: (parentId: string) => Post[];
} {
  const byParent: Record<string, Post[]> = {};
  for (const p of posts) {
    const pid = p.parent_id || p.parent_post_id;
    if (!pid) continue;
    byParent[pid] = byParent[pid] || [];
    byParent[pid].push(p);
  }
  const roots = posts.filter((p) => !(p.parent_id || p.parent_post_id));
  roots.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return {
    roots,
    getChildren: (id: string) => byParent[id] || [],
  };
}
