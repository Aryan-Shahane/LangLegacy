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
        <main className="mx-auto min-h-screen max-w-5xl p-4">{children}</main>
      </body>
    </html>
  );
}
