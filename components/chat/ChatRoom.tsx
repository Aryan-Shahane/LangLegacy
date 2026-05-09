"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import MessageBubble from "@/components/chat/MessageBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadInitial = async () => {
    try {
      const res = await fetch(`/api/rooms/${room._id}/messages`);
      if (!res.ok) return;
      const data = (await res.json()) as Message[];
      setMessages(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear outgoing room thread before reload
    setMessages([]);
    void loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room._id]);

  useEffect(() => {
    const source = new EventSource(`/api/rooms/${room._id}/stream`);
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as Message[];
        setMessages((prev) => {
          const map = new Map(prev.map((m) => [m._id, m]));
          payload.forEach((p) => map.set(p._id, p));
          return Array.from(map.values()).sort((a, b) => a.created_at.localeCompare(b.created_at));
        });
      } catch {
        // ignore malformed event
      }
    };
    return () => source.close();
  }, [room._id]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
      _id: tempId,
      type: "message",
      room_id: room._id,
      language_code: languageCode,
      author_id: "me",
      author_name: "You",
      body: text,
      report_count: 0,
      status: "active",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setDraft("");
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/rooms/${room._id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language_code: languageCode, body: text, author_name: "You" }),
      });
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Failed to send message.");
      }

      const realMessage = (await res.json()) as Message;
      setMessages((prev) => prev.map((m) => (m._id === tempId ? realMessage : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
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
          isOwn={message.author_name.toLowerCase() === "you"}
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
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] max-h-[800px] flex-col overflow-hidden rounded-2xl border border-[#C3C8C1]/35 bg-[#F5F3EE]">
      <header className="flex shrink-0 items-center justify-between border-b border-[#C3C8C1]/35 bg-[#FFFFFF] px-5 py-4">
        <div>
          <p className="font-serif text-4xl leading-tight text-[#061B0E]">{room.name}</p>
          <p className="text-sm text-[#5A665F]">Led by language circle moderators</p>
        </div>
        <div className="flex items-center gap-2 text-[#6D726D]">
          <span className="grid h-8 w-8 place-content-center rounded-full border border-[#C3C8C1]/60 text-xs">i</span>
          <span className="grid h-8 w-8 place-content-center rounded-full border border-[#C3C8C1]/60 text-xs">⋮</span>
        </div>
      </header>

      <div className="shrink-0 bg-gradient-to-b from-[#E6DAD5] via-[#D8CCD0] to-[#F3ECE6] px-5 py-4">
        <p className="text-center text-xs font-medium uppercase tracking-[0.28em] text-[#847A7A]">Today</p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-[#E6DAD5] via-[#D8CCD0] to-[#F3ECE6] px-5 pb-6">
        {content.length ? content : <p className="text-center text-sm text-[#6D726D]">No messages yet. Start the first voice-thread.</p>}
        <div ref={messagesEndRef} />
      </div>

      <footer className="shrink-0 border-t border-[#C3C8C1]/35 bg-[#FFFFFF] p-4">
        <div className="flex items-center gap-2 rounded-full border border-[#C3C8C1]/45 bg-[#F5F3EE] px-3 py-2">
          <button type="button" className="text-lg text-[#6D726D]">
            +
          </button>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void sendMessage();
            }}
            className="h-10 border-none bg-transparent px-2 text-[#1B1C19] shadow-none ring-0 focus-visible:ring-0"
            placeholder="Share your voice..."
          />
          <button type="button" className="text-base text-[#6D726D]">
            ☺
          </button>
          <Button
            type="button"
            disabled={busy || !draft.trim()}
            onClick={() => void sendMessage()}
            size="sm"
            className="h-9 w-9 rounded-full p-0 transition-opacity disabled:opacity-50"
          >
            ▶
          </Button>
        </div>
        {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}
      </footer>
    </div>
  );
}
