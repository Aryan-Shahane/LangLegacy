"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DictionaryClient from "@/app/[language]/DictionaryClient";
import FlashCard from "@/components/FlashCard";
import PostCard from "@/components/PostCard";
import PostComposer from "@/components/PostComposer";
import ProgressBar from "@/components/ProgressBar";
import RoomList from "@/components/RoomList";
import SessionSummary from "@/components/SessionSummary";
import type { Entry, LearningProgress, Post, Room, UserRole } from "@/lib/types";

type TabKey = "dictionary" | "community" | "chatrooms" | "learning";

export default function LanguageTabsPanel({
  languageCode,
  viewerRole,
}: {
  languageCode: string;
  viewerRole: UserRole;
}) {
  const [tab, setTab] = useState<TabKey>("dictionary");
  const [posts, setPosts] = useState<Post[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [cards, setCards] = useState<Entry[]>([]);
  const [queue, setQueue] = useState<Entry[]>([]);
  const [correct, setCorrect] = useState(0);
  const [seen, setSeen] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const searchParams = useSearchParams();

  const loadPosts = async () => {
    const res = await fetch(`/api/posts?language_code=${encodeURIComponent(languageCode)}`);
    if (!res.ok) return;
    setPosts((await res.json()) as Post[]);
  };

  const loadRooms = async () => {
    const res = await fetch(`/api/rooms?language_code=${encodeURIComponent(languageCode)}`);
    if (!res.ok) return;
    setRooms((await res.json()) as Room[]);
  };

  const loadProgress = async () => {
    const res = await fetch(`/api/learning/progress?language_code=${encodeURIComponent(languageCode)}`);
    if (!res.ok) return;
    setProgress((await res.json()) as LearningProgress);
  };

  const loadCards = async () => {
    const res = await fetch(`/api/learning/cards?language_code=${encodeURIComponent(languageCode)}&n=10`);
    if (!res.ok) return;
    const next = (await res.json()) as Entry[];
    setCards(next);
    setQueue(next);
    setCorrect(0);
    setSeen(0);
    setStartedAt(Date.now());
    setCompleted(false);
  };

  useEffect(() => {
    const fromUrl = searchParams.get("tab");
    if (fromUrl === "community" || fromUrl === "chatrooms" || fromUrl === "learning") {
      setTab(fromUrl);
      return;
    }
    setTab("dictionary");
  }, [searchParams]);

  useEffect(() => {
    if (tab === "community") void loadPosts();
    if (tab === "chatrooms") void loadRooms();
    if (tab === "learning") {
      void loadProgress();
      if (!cards.length) void loadCards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, languageCode]);

  const activeCard = queue[0];
  const durationSeconds = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;

  const learningBody =
    completed ? (
      <SessionSummary
        seen={seen}
        correct={correct}
        durationSeconds={durationSeconds}
        onRestart={() => void loadCards()}
      />
    ) : !activeCard ? (
      <p className="text-sm text-slate-500">Loading cards...</p>
    ) : (
      <FlashCard
        entry={activeCard}
        onRate={(score) => {
          const nextSeen = seen + 1;
          const nextCorrect = score === "got" ? correct + 1 : correct;
          setSeen(nextSeen);
          setCorrect(nextCorrect);
          setQueue((prev) => {
            const [first, ...rest] = prev;
            if (!first) return prev;
            const updated = score === "missed" ? [...rest, first] : rest;
            if (updated.length === 0) {
              setCompleted(true);
              void fetch("/api/learning/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  language_code: languageCode,
                  cards_seen: nextSeen,
                  cards_correct: nextCorrect,
                  duration_seconds: durationSeconds,
                }),
              }).then(() => loadProgress());
            }
            return updated;
          });
        }}
      />
    );

  return (
    <div className="space-y-4">
      {tab === "dictionary" ? <DictionaryClient languageCode={languageCode} /> : null}

      {tab === "community" ? (
        <div className="space-y-3">
          <PostComposer
            onSubmit={async (body) => {
              await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language_code: languageCode, body }),
              });
              await loadPosts();
            }}
          />
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onReact={async (emoji) => {
                await fetch(`/api/posts/${post._id}/react`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ emoji }),
                });
                await loadPosts();
              }}
              onReport={async (payload) => {
                await fetch(`/api/posts/${post._id}/report`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...payload, language_code: languageCode }),
                });
              }}
            />
          ))}
          {posts.length === 0 ? <p className="text-sm text-slate-500">No posts yet.</p> : null}
        </div>
      ) : null}

      {tab === "chatrooms" ? (
        <RoomList
          rooms={rooms}
          languageCode={languageCode}
          viewerRole={viewerRole}
          onCreateRoom={async (name, description) => {
            await fetch("/api/rooms", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ language_code: languageCode, name, description }),
            });
            await loadRooms();
          }}
        />
      ) : null}

      {tab === "learning" ? (
        <div className="space-y-3">
          {progress ? <ProgressBar progress={progress} /> : null}
          {learningBody}
        </div>
      ) : null}
    </div>
  );
}
