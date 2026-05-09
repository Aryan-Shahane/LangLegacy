import type { Report, ReportTargetType } from "@/lib/types";

export type ContentDb = "entries" | "posts" | "poetry" | "stories" | "messages";

export function reportRefs(r: Pick<Report, "content_type" | "content_id" | "target_type" | "target_id">): {
  content_type: ReportTargetType;
  content_id: string;
} {
  const content_type = (r.content_type || r.target_type) as ReportTargetType | undefined;
  const content_id = r.content_id || r.target_id;
  if (!content_type || !content_id)
    throw new Error("report missing content reference");
  return { content_type, content_id };
}

export function databaseForReportContentType(type: ReportTargetType): ContentDb {
  switch (type) {
    case "entry":
      return "entries";
    case "post":
      return "posts";
    case "poem":
      return "poetry";
    case "story":
      return "stories";
    case "message":
      return "messages";
    default:
      return "posts";
  }
}
