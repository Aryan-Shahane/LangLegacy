import type { Entry } from "@/lib/types";
import AudioPlayer from "./AudioPlayer";

export default function DictionaryEntry({ entry }: { entry: Entry }) {
  return (
    <article className="panel space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{entry.word}</h3>
        <span className="rounded bg-slate-700 px-2 py-1 text-xs">{entry.part_of_speech || "other"}</span>
      </div>
      {entry.phonetic ? <p className="text-sm text-slate-400">{entry.phonetic}</p> : null}
      <p>{entry.translation}</p>
      {entry.example_sentence ? (
        <p className="text-sm italic text-slate-300">
          {entry.example_sentence}
          {entry.example_translation ? ` (${entry.example_translation})` : ""}
        </p>
      ) : null}
      {entry.audio_url ? <AudioPlayer src={entry.audio_url} word={entry.word} /> : null}
      <span className="rounded bg-slate-800 px-2 py-1 text-xs">
        {entry.source === "community" ? "Community" : "Archive"}
      </span>
    </article>
  );
}
