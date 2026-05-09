import { redirect } from "next/navigation";

/** Overview lives at `/` for logged-in moderators; keep `/mod` as a bookmark-friendly redirect. */
export default function ModOverviewRedirectPage() {
  redirect("/");
}
