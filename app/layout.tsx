import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "LangLegacy",
  description: "Interactive endangered language dictionaries",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="grain-overlay" aria-hidden />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
