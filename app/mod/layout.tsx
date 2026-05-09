import type { ReactNode } from "react";
import ModeratorLayout from "@/components/moderator/ModeratorLayout";

export default function ModLayout({ children }: { children: ReactNode }) {
  return <ModeratorLayout>{children}</ModeratorLayout>;
}
