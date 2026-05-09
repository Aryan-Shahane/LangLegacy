"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import FlashCard from "@/components/FlashCard";
import ProgressBar from "@/components/ProgressBar";
import SessionSummary from "@/components/SessionSummary";
import type { Entry, LearningProgress } from "@/lib/types";

type LearnState = {
  deck: Entry[];
  queue: Entry[];
  correct: number;
  rated: number;
  startedAt: number | null;
  completed: boolean;
};

type Action =
  | { type: "reset_deck"; entries: Entry[] }
  | { type: "got" }
  | { type: "missed" };

function reducer(state: LearnState, action: Action): LearnState {
  switch (action.type) {
    case "reset_deck":
      return {
        deck: action.entries,
        queue: action.entries,
        correct: 0,
        rated: 0,
        startedAt: Date.now(),
        completed: false,
      };
    case "got": {
      const [, ...rest] = state.queue;
      const nextRated = state.rated + 1;
      const nextCorrect = state.correct + 1;
      return {
        ...state,
        rated: nextRated,
        correct: nextCorrect,
        queue: rest,
        completed: rest.length === 0 ? true : state.completed,
      };
    }
    case "missed": {
      const [first, ...rest] = state.queue;
      if (!first) return state;
      return {
        ...state,
        rated: state.rated + 1,
        queue: [...rest, first],
      };
    }
    default:
      return state;
  }
}

const INITIAL: LearnState = {
  deck: [],
  queue: [],
  correct: 0,
  rated: 0,
  startedAt: null,
  completed: false,
};

export default function LearnSession({ languageCode }: { languageCode: string }) {
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const sessionPostedRef = useRef(false);

  const loadProgress = useCallback(async () => {
    const res = await fetch(`/api/learning/progress?language_code=${encodeURIComponent(languageCode)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    setProgress((await res.json()) as LearningProgress);
  }, [languageCode]);

  const shuffle = useCallback(<T,>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5), []);

  const buildDeck = useCallback(async () => {
    const res = await fetch(
      `/api/entries?language_code=${encodeURIComponent(languageCode)}&limit=250&offset=0`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error || "Could not load dictionary entries.");
    }
    const all = shuffle((await res.json()) as Entry[]);
    const live = all.filter((e) => e.status !== "removed");
    if (live.length === 0) throw new Error("No dictionary entries to study yet.");
    sessionPostedRef.current = false;
    dispatch({ type: "reset_deck", entries: live });
  }, [languageCode, shuffle]);

  useEffect(() => {
    let m = true;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([loadProgress(), buildDeck()]);
      } catch (e) {
        if (m) setError(e instanceof Error ? e.message : "Failed to prepare session.");
      }
      if (m) setLoading(false);
    })();
    return () => {
      m = false;
    };
  }, [buildDeck, loadProgress]);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!state.startedAt) return undefined;
    if (state.completed) {
      const id = window.setTimeout(() => {
        setElapsedSeconds(Math.max(0, Math.floor((Date.now() - state.startedAt!) / 1000)));
      }, 0);
      return () => window.clearTimeout(id);
    }
    const tick = () =>
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - state.startedAt!) / 1000)));
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 500);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [state.startedAt, state.completed]);

  useEffect(() => {
    if (!state.completed || !state.startedAt || sessionPostedRef.current) return;
    sessionPostedRef.current = true;
    const rated = state.rated;
    const dur = Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000));
    void fetch("/api/learning/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language_code: languageCode,
        cards_seen: rated,
        cards_correct: state.correct,
        duration_seconds: dur,
      }),
    }).then(() => loadProgress());
  }, [languageCode, loadProgress, state.completed, state.startedAt, state.correct, state.rated]);

  const deckSize = state.deck.length;
  const mastered = deckSize > 0 ? deckSize - state.queue.length : 0;
  const activeCard = state.queue[0];

  if (loading) {
    return <p className="text-sm text-[#757C76]">Preparing your deck…</p>;
  }

  if (error) {
    return <p className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>;
  }

  const bodyInner =
    state.completed || state.queue.length === 0 ? (
      <SessionSummary
        seen={state.rated}
        correct={state.correct}
        durationSeconds={elapsedSeconds}
        onRestart={() =>
          void (async () => {
            await buildDeck();
            await loadProgress();
          })()
        }
      />
    ) : !activeCard ? (
      <p className="text-sm text-[#757C76]">Loading cards…</p>
    ) : (
      <>
        {progress ? (
          <ProgressBar progress={progress} cardIndex={Math.min(mastered + 1, deckSize)} cardTotal={deckSize} />
        ) : null}
        <FlashCard
          key={activeCard._id}
          entry={activeCard}
          onGot={() => dispatch({ type: "got" })}
          onMissed={() => dispatch({ type: "missed" })}
        />
      </>
    );

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Link
          href={`/${languageCode}`}
          className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6D726D] hover:text-[#061B0E]"
        >
          Back to Dictionary
        </Link>
      </div>
      {bodyInner}
    </div>
  );
}
