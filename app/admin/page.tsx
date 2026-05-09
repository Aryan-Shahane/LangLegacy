import UploadFlow from "@/components/UploadFlow";

export default function AdminPage() {
  return (
    <section className="space-y-4">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold text-slate-100">Corpus ingest (bulk upload)</h1>
        <div className="text-sm leading-relaxed text-slate-400">
          <p>
            Pipeline: <span className="text-slate-200">bulk audio uploads</span> →{" "}
            <span className="text-slate-200">local Whisper transcription</span> →{" "}
            <span className="text-slate-200">IBM watsonx vocabulary extraction</span> → bilingual review surface → hardened{" "}
            <span className="text-slate-200">Cloudant persistence</span> with optional Cloudinary audio references.
          </p>
          <p className="mt-3">
            You should curate transcripts and gloss pairs before committing them—LangLegacy merges every queued file&apos;s guesses into a
            unified checklist so corrections happen once.
          </p>
        </div>
      </div>
      <UploadFlow />
    </section>
  );
}
