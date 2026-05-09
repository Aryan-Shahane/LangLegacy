"use client";

import { useEffect, useMemo, useState } from "react";
import MessageBubble from "@/components/MessageBubble";
import type { Message, Room } from "@/lib/types";

export default function ChatRoom({
  room,
  languageCode,
}: {
  room: Room;
  languageCode: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const loadInitial = async () => {
    const res = await fetch(`/api/rooms/${room._id}/messages`);
    if (!res.ok) return;
    const data = (await res.json()) as Message[];
    setMessages(data);
  };

  useEffect(() => {
    void loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room._id]);

  useEffect(() => {
    const source = new EventSource(`/api/rooms/${room._id}/stream`);
    source.addEventListener("messages", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as Message[];
        setMessages((prev) => {
          const map = new Map(prev.map((m) => [m._id, m]));
          payload.forEach((p) => map.set(p._id, p));
          return Array.from(map.values()).sort((a, b) => a.created_at.localeCompare(b.created_at));
        });
      } catch {
        // ignore malformed event
      }
    });
    return () => source.close();
  }, [room._id]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/rooms/${room._id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language_code: languageCode, body: text }),
      });
      if (res.ok) setDraft("");
    } finally {
      setBusy(false);
    }
  };

  const content = useMemo(
    () =>
      messages.map((message) => (
        <MessageBubble
          key={message._id}
          message={message}
          onReport={async (payload) => {
            await fetch(`/api/messages/${message._id}/report`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...payload, language_code: languageCode }),
            });
          }}
        />
      )),
    [messages, languageCode]
  );

  return (
    <div className="panel space-y-3">
      <div>
        <p className="text-sm font-semibold text-slate-100">{room.name}</p>
        <p className="text-xs text-slate-500">{room.description}</p>
      </div>
      <div className="max-h-80 space-y-2 overflow-y-auto">{content}</div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
          placeholder="Type a message..."
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void sendMessage()}
          className="rounded bg-cyan-700 px-3 py-2 text-sm hover:bg-cyan-600 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
