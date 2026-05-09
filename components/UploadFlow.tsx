"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ExtractedEntry, Language } from "@/lib/types";

type Phase = "pick" | "run" | "review" | "save" | "done";

function emptyExtracted(): ExtractedEntry {
  return {
    word: "",
    translation: "",
    definition: "",
    phonetic: "",
    part_of_speech: "other",
    example_sentence: "",
    example_translation: "",
  };
}

type EditableRow = {
  rowId: string;
  batchLabel: string;
  data: ExtractedEntry;
};

function newRow(batchLabel: string, data?: Partial<ExtractedEntry>): EditableRow {
  return {
    rowId:
      typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto
        ? globalThis.crypto.randomUUID()
        : `${batchLabel}:${Math.random().toString(36).slice(2)}`,
    batchLabel,
    data: { ...emptyExtracted(), ...data },
  };
}

export default function UploadFlow() {
  const [phase, setPhase] = useState<Phase>("pick");
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageCode, setLanguageCode] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [liveLog, setLiveLog] = useState("");
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [combinedTranscripts, setCombinedTranscripts] = useState<Array<{ file: string; text: string }>>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/languages");
        const data = (await res.json()) as Language[] | { error?: string };
        if (!res.ok || !Array.isArray(data)) throw new Error("Could not load languages");
        data.sort((a, b) => a.name.localeCompare(b.name));
        setLanguages(data);
        if (data[0]?.code) setLanguageCode(data[0].code);
      } catch (e) {
        setGlobalError(e instanceof Error ? e.message : "Could not reach /api/languages");
      }
    })();
  }, []);

  const selectedLanguage = useMemo(
    () => languages.find((l) => l.code === languageCode),
    [languageCode, languages]
  );

  const onFilesChosen = (list: FileList | null) => {
    const next = list ? Array.from(list).filter((f) => f.size > 0) : [];
    setPendingFiles(next);
    setGlobalError(null);
  };

  const runBulkPipeline = async () => {
    if (!selectedLanguage || pendingFiles.length === 0) return;
    setGlobalError(null);
    setCombinedTranscripts([]);
    setRows([]);
    setPhase("run");

    try {
      const transcriptLog: typeof combinedTranscripts = [];
      const nextRows: EditableRow[] = [];

      let index = 0;
      for (const file of pendingFiles) {
        index += 1;
        setLiveLog(`(${index}/${pendingFiles.length}) Uploading audio…`);

        const fd = new FormData();
        fd.append("audio", file);
        fd.append("language_code", selectedLanguage.code);
        const transcribeRes = await fetch("/api/transcribe", {
          method: "POST",
          body: fd,
        });
        const transcribeJson = (await transcribeRes.json()) as {
          transcript?: string;
          error?: string;
        };
        if (!transcribeRes.ok) {
          throw new Error(transcribeJson.error || `"${file.name}" transcription failed (${transcribeRes.status})`);
        }

        const transcript = transcribeJson.transcript?.trim() || "";

        setLiveLog(`(${index}/${pendingFiles.length}) Transcribing speech…`);
        setLiveLog(`(${index}/${pendingFiles.length}) Extracting vocabulary…`);

        const extractRes = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: transcript || `(${selectedLanguage.name} archival audio — Whisper returned empty.)`,
            language_name: selectedLanguage.name,
            language_code: selectedLanguage.code,
          }),
        });
        const extractJson = (await extractRes.json()) as { entries?: ExtractedEntry[]; error?: string };
        if (!extractRes.ok) {
          throw new Error(extractJson.error || `"${file.name}" vocabulary extraction failed (${extractRes.status})`);
        }

        transcriptLog.push({ file: file.name, text: transcript });

        const extracted = extractJson.entries?.filter((e) => e && typeof e.word === "string") || [];
        if (extracted.length === 0) {
          nextRows.push(newRow(`${file.name} · manual`, {}));
        } else {
          extracted.forEach((entry, glossIndex) => {
            nextRows.push(
              newRow(`${file.name} · gloss ${glossIndex + 1}`, {
                word: entry.word,
                phonetic: entry.phonetic ?? "",
                translation: entry.translation || "",
                definition: entry.definition ?? "",
                part_of_speech: entry.part_of_speech || "other",
                example_sentence: entry.example_sentence ?? "",
                example_translation: entry.example_translation ?? "",
              })
            );
          });
        }
      }

      setCombinedTranscripts(transcriptLog);
      setRows(nextRows);
      setPhase("review");
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Bulk processing failed.");
      setPhase("pick");
    } finally {
      setLiveLog("");
    }
  };

  const saveAllArchiveEntries = async () => {
    if (!selectedLanguage) return;
    setGlobalError(null);
    setSavedCount(0);
    setPhase("save");

    try {
      let ok = 0;
      for (const row of rows) {
        const d = row.data;
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language_code: selectedLanguage.code,
            word: d.word.trim() || "(untitled archive gloss)",
            phonetic: (d.phonetic ?? "").trim() || null,
            translation: d.translation.trim() || "(needs translation)",
            definition: (d.definition ?? "").trim() || null,
            part_of_speech: (d.part_of_speech ?? "").trim() || null,
            example_sentence: (d.example_sentence ?? "").trim() || null,
            example_translation: (d.example_translation ?? "").trim() || null,
            source: "archive",
          }),
        });

        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) throw new Error(j.error || `Save failed for “${row.data.word || row.batchLabel}”`);

        ok += 1;
        setSavedCount(ok);
      }
      setPhase("done");
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Saving failed.");
      setPhase("review");
    }
  };

  const updateRow = (rowId: string, patch: Partial<ExtractedEntry>) => {
    setRows((prev) =>
      prev.map((r) => (r.rowId === rowId ? { ...r, data: { ...r.data, ...patch } } : r))
    );
  };

  const removeRow = (rowId: string) => {
    setRows((prev) => prev.filter((r) => r.rowId !== rowId));
  };

  return (
    <div className="space-y-4">
      {globalError ? (
        <p className="rounded border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">{globalError}</p>
      ) : null}

      {phase === "pick" ? (
        <div className="panel space-y-3">
          <p className="text-xs text-slate-500">
            Select one endangered language row and choose <span className="text-slate-300">many</span> audio files from your
            archive. LangLegacy runs Whisper for each recording, merges every watsonx draft into one review checklist, then
            saves whichever rows you finalize.
          </p>
          <label className="block text-xs text-slate-400">
            Target language
            <select
              className="mt-1 w-full rounded bg-slate-950 p-2 text-slate-100"
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value)}
              disabled={!languages.length}
            >
              {languages.map((language) => (
                <option key={language._id} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-slate-400">
            Bulk audio uploads
            <input
              className="mt-1 block w-full text-sm"
              type="file"
              accept="audio/*"
              multiple
              onChange={(e) => onFilesChosen(e.target.files)}
            />
          </label>
          <p className="text-xs text-slate-500">{pendingFiles.length} file(s) staged.</p>
          <button
            type="button"
            disabled={!selectedLanguage || pendingFiles.length === 0}
            onClick={() => void runBulkPipeline()}
            className="rounded bg-cyan-700 px-3 py-2 text-sm hover:bg-cyan-600 disabled:opacity-40"
          >
            Transcribe + extract vocabulary
          </button>
          {!languages.length ? (
            <p className="text-xs text-amber-300">No languages detected — seed IBM Cloudant first.</p>
          ) : null}
        </div>
      ) : null}

      {phase === "run" ? (
        <div className="panel space-y-2 text-sm text-slate-200">
          <p className="font-semibold text-amber-200/90">Processing bulk recordings</p>
          <p>{liveLog || "Preparing Whisper…"}</p>
          <p className="text-xs text-slate-400">Closing this tab interrupts the ingest — keep this page open.</p>
        </div>
      ) : null}

      {phase === "review" || phase === "save" ? (
        <div className="space-y-3">
          {combinedTranscripts.length ? (
            <details className="panel text-sm text-slate-300">
              <summary className="cursor-pointer select-none text-slate-200">Whole-file transcripts ({combinedTranscripts.length})</summary>
              <div className="mt-3 space-y-4">
                {combinedTranscripts.map((t) => (
                  <div key={t.file}>
                    <p className="text-xs font-semibold text-slate-500">{t.file}</p>
                    <p>{t.text || "(empty)"}</p>
                  </div>
                ))}
              </div>
            </details>
          ) : null}

          <div className="panel space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="font-medium text-slate-100">{rows.length} draft entr{rows.length === 1 ? "y" : "ies"}</p>
                <p className="text-xs text-slate-500">
                  Glosses originate from Whisper + IBM watsonx outputs. Tune every field below before publishing to the public
                  dictionary (source&nbsp;
                  <span className="text-slate-300">archive</span>).
                </p>
              </div>
              <button
                type="button"
                disabled={phase === "save"}
                className="rounded border border-dashed border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-900 disabled:opacity-40"
                onClick={() =>
                  setRows((prev) => [...prev, newRow(selectedLanguage?.name ? `${selectedLanguage.name} · manual` : "manual", {})])
                }
              >
                Add blank gloss
              </button>
            </div>

            <div className="space-y-4">
              {rows.map((row) => (
                <div key={row.rowId} className="rounded border border-slate-700 bg-slate-950 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-2">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{row.batchLabel}</p>
                    <button type="button" className="text-xs text-rose-300 underline" onClick={() => removeRow(row.rowId)}>
                      Remove gloss
                    </button>
                  </div>
                  <div className="grid gap-2 lg:grid-cols-2">
                    <label className="block text-xs text-slate-500">
                      Lexeme / phrase
                      <input
                        className="mt-1 w-full rounded border border-slate-800 bg-transparent px-2 py-1"
                        value={row.data.word}
                        onChange={(e) => updateRow(row.rowId, { word: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs text-slate-500">
                      Translation
                      <input
                        className="mt-1 w-full rounded border border-slate-800 bg-transparent px-2 py-1"
                        value={row.data.translation}
                        onChange={(e) => updateRow(row.rowId, { translation: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs text-slate-500 lg:col-span-2">
                      Definition / cultural gloss
                      <textarea
                        className="mt-1 w-full rounded border border-slate-800 bg-transparent px-2 py-1 text-sm"
                        rows={2}
                        value={row.data.definition || ""}
                        onChange={(e) => updateRow(row.rowId, { definition: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs text-slate-500 lg:col-span-2">
                      Phonetic
                      <input
                        className="mt-1 w-full rounded border border-slate-800 bg-transparent px-2 py-1"
                        value={row.data.phonetic || ""}
                        onChange={(e) => updateRow(row.rowId, { phonetic: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs text-slate-500">
                      Part of speech
                      <input
                        className="mt-1 w-full rounded border border-slate-800 bg-transparent px-2 py-1"
                        value={row.data.part_of_speech || ""}
                        onChange={(e) => updateRow(row.rowId, { part_of_speech: e.target.value })}
                      />
                    </label>
                  </div>
                  <label className="mt-2 block text-xs text-slate-500">
                    Example sentence
                    <textarea
                      className="mt-1 w-full rounded border border-slate-800 bg-transparent px-2 py-1 text-sm"
                      rows={2}
                      value={row.data.example_sentence || ""}
                      onChange={(e) => updateRow(row.rowId, { example_sentence: e.target.value })}
                    />
                  </label>
                  <label className="mt-2 block text-xs text-slate-500">
                    Example translation
                    <textarea
                      className="mt-1 w-full rounded border border-slate-800 bg-transparent px-2 py-1 text-sm"
                      rows={2}
                      value={row.data.example_translation || ""}
                      onChange={(e) => updateRow(row.rowId, { example_translation: e.target.value })}
                    />
                  </label>
                </div>
              ))}
              {!rows.length ? <p className="text-xs text-slate-500">No rows — add blanks or rerun the pipeline.</p> : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={phase === "save" || !rows.length}
                onClick={() => void saveAllArchiveEntries()}
                className="rounded bg-emerald-700 px-3 py-2 text-sm hover:bg-emerald-600 disabled:opacity-40"
              >
                {phase === "save"
                  ? `Saving ${savedCount}/${rows.length}…`
                  : `Save ${rows.length} entr${rows.length === 1 ? "y" : "ies"} to Cloudant`}
              </button>
              <button
                type="button"
                disabled={phase === "save"}
                className="rounded border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-40"
                onClick={() => {
                  setPhase("pick");
                  setRows([]);
                  setCombinedTranscripts([]);
                  setSavedCount(0);
                }}
              >
                Discard and restart
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {phase === "done" && selectedLanguage ? (
        <div className="panel space-y-2">
          <p className="text-slate-100">Queued archive entries persisted.</p>
          <Link className="text-cyan-300 underline" href={`/${selectedLanguage.code}`}>
            Review public dictionary · {selectedLanguage.name}
          </Link>
          <button
            type="button"
            className="ml-0 block rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-900"
            onClick={() => {
              setPhase("pick");
              setRows([]);
              setCombinedTranscripts([]);
              setPendingFiles([]);
              setSavedCount(0);
            }}
          >
            Queue another ingest
          </button>
        </div>
      ) : null}
    </div>
  );
}
