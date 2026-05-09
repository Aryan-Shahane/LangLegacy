import Link from "next/link";
import type { ReactNode } from "react";

const SAMPLE_LANGUAGE_DOC = `{
  "_id": "xyz",
  "type": "language",
  "name": "Example language",
  "code": "xyz",
  "region": "Pacific",
  "speaker_count": 1200,
  "entry_count": 0,
  "created_at": "2026-05-08T12:00:00.000Z"
}`;

export default function AdminLayout({ children }: { children: ReactNode }) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const cloudConsole = cloudName
    ? `https://console.cloudinary.com/console/c-${cloudName}`
    : "https://console.cloudinary.com/";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-900/50 bg-slate-900/70 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Administrator</p>
          <p className="mt-2 text-xs text-slate-500">
            There is no sign-in gate yet. Operational security relies on guarding <code className="text-slate-300">.env.local</code>,
            restricting hosting access, and managing IBM Cloud / Cloudinary roles yourself.
          </p>
          <nav className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
            <Link href="/" className="text-cyan-300 hover:text-cyan-200">
              ← Community site
            </Link>
            <a href={cloudConsole} className="text-amber-200/90 hover:text-amber-100" target="_blank" rel="noreferrer">
              Cloudinary dashboard
            </a>
            <a
              href="https://cloud.ibm.com/catalog/services/watsonx"
              className="text-amber-200/90 hover:text-amber-100"
              target="_blank"
              rel="noreferrer"
            >
              IBM watsonx console
            </a>
          </nav>
        </div>
      </div>

      <details className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300">
        <summary className="cursor-pointer select-none text-sm font-medium text-slate-200">
          Seeding endangered languages inside Cloudant
        </summary>
        <ol className="mt-3 list-decimal space-y-2 ps-6 text-left">
          <li>Open IBM Cloudant and log into your database.</li>
          <li>Create or reuse the Cloudant databases your <code>.env.local</code> credentials target (languages + entries shells).</li>
          <li>
            For every language shell document, replicate the CouchDB-shaped JSON shown below (<code>_id</code> must mirror the{" "}
            <span className="text-slate-200">language code</span> your UI routes expect).
          </li>
          <li>Keep <span className="text-slate-200">entry_count</span> in sync as you ingest additional archive rows.</li>
        </ol>
        <pre className="mt-3 overflow-auto rounded-md border border-slate-700 bg-black/60 p-3 font-mono text-[11px] leading-relaxed text-slate-200">
          {SAMPLE_LANGUAGE_DOC}
        </pre>
      </details>

      <details className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-300">
        <summary className="cursor-pointer select-none text-sm font-medium text-slate-200">
          Operational reminders
        </summary>
        <ul className="mt-3 list-disc space-y-2 ps-6 text-left">
          <li>Every upload stage hits local Whisper plus IBM watsonx — monitor spend and quota from the IBM Cloud dashboard.</li>
          <li>Community contributions land with source&nbsp;<span className="text-slate-200">community</span>; bulk ingest persists as&nbsp;<span className="text-slate-200">archive</span>.</li>
          <li>Audio artifacts render through whichever Cloudinary URL <code className="text-slate-200">COS</code> helpers produce — prune media there.</li>
        </ul>
      </details>

      {children}
    </div>
  );
}
