"use client";

export default function LanguagePageGlobalStyle() {
  return (
    <style jsx global>{`
      body {
        background: #f3f1ed;
        color: #18261f;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      }
      main {
        max-width: none !important;
        padding: 0 !important;
      }
      main > header {
        display: none !important;
      }
      nav[aria-label="Language sections"] {
        display: none !important;
      }
    `}</style>
  );
}
