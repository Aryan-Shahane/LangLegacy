import type { ReactNode } from "react";
import TopBar from "@/components/TopBar";

export default function ModLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <TopBar activeTab="dictionary" />
      <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
    </div>
  );
}
