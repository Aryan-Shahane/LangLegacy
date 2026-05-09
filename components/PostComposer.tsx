"use client";

import { useState } from "react";

export default function PostComposer({
  onSubmit,
}: {
  onSubmit: (body: string) => Promise<void> | void;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    try {
      await onSubmit(text);
      setBody("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel space-y-2">
      <textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share a community update for this language..."
        className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="rounded bg-cyan-700 px-3 py-2 text-sm hover:bg-cyan-600 disabled:opacity-50"
      >
        {busy ? "Posting..." : "Publish post"}
      </button>
    </div>
  );
}
