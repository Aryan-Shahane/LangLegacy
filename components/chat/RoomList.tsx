"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatRoom from "@/components/chat/ChatRoom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Room, UserRole } from "@/lib/types";

export default function RoomList({
  rooms,
  languageCode,
  onCreateRoom,
}: {
  rooms: Room[];
  languageCode: string;
  viewerRole: UserRole;
  onCreateRoom: (name: string, description: string) => Promise<void>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomParam = searchParams.get("room");

  const [activeId, setActiveId] = useState<string>(roomParam || rooms[0]?._id || "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busyCreate, setBusyCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [showList, setShowList] = useState(!roomParam);

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      if (a.name.toLowerCase() === "general") return -1;
      if (b.name.toLowerCase() === "general") return 1;
      return a.created_at.localeCompare(b.created_at);
    });
  }, [rooms]);

  useEffect(() => {
    if (!activeId && sortedRooms[0]?._id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- derive default circle from SSR list
      setActiveId(sortedRooms[0]._id);
    }
  }, [sortedRooms, activeId]);

  useEffect(() => {
    if (roomParam && roomParam !== activeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- keep selection in sync with URL ?room=
      setActiveId(roomParam);
      setShowList(false);
    }
  }, [roomParam, activeId]);

  const selectRoom = (id: string) => {
    setActiveId(id);
    setShowList(false);

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "chatrooms");
    params.delete("section");
    params.set("room", id);
    router.push(`/${languageCode}?${params.toString()}`);
  };

  const active = sortedRooms.find((r) => r._id === activeId) || sortedRooms[0] || null;
  const memberCount = useMemo(
    () => (id: string, base: number) => {
      const seed = Array.from(id).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      return base + (seed % 47);
    },
    []
  );

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#CC8E7A] via-[#8A6F88] to-[#F0A482] p-5">
      <div className="grid gap-4 xl:grid-cols-[0.44fr_0.56fr]">
        <section className={`space-y-3 ${!showList ? "hidden xl:block" : "block"}`}>
          <div className="flex items-end justify-between">
            <h2 className="font-serif text-5xl leading-tight text-[#1F1C1C]">Discover Circles</h2>
            <button type="button" className="text-sm font-semibold uppercase tracking-wide text-[#633D3A]">
              View All
            </button>
          </div>

          <div className="max-h-[600px] space-y-3 overflow-y-auto pr-2">
            {sortedRooms.map((room) => {
              const activeNow = room._id === active?._id;
              return (
                <Card
                  key={room._id}
                  className={`cursor-pointer p-5 transition-all ${activeNow ? "border-[#C4622D] shadow-md" : "hover:border-[#C4622D]/45"}`}
                  onClick={() => selectRoom(room._id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-[40px] leading-tight text-[#1F1C1C]">{room.name}</h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${activeNow ? "bg-[#D0E9D4] text-[#2E5E46]" : "bg-[#F0EEE9] text-[#676F69]"}`}
                    >
                      {activeNow ? "Active Now" : `${memberCount(room._id, 4) % 25} Online`}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-[#454A45]">{room.description || "Open language practice session."}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#454A45]">{memberCount(room._id, 20)} Members</p>
                    <Button size="sm" variant={activeNow ? "primary" : "outline"} className={activeNow ? "" : "border-[#C4622D]/50 text-[#7A3920]"}>
                      {activeNow ? "Entering..." : "Join Room"}
                    </Button>
                  </div>
                </Card>
              );
            })}
            {!sortedRooms.length ? (
              <Card className="p-5 text-center">
                <p className="font-serif text-2xl text-[#1F1C1C]">No circles yet</p>
                <p className="mt-1 text-sm text-[#5E635E]">Create one to begin real-time language chat.</p>
              </Card>
            ) : null}
          </div>

          <div className="mt-4">
            <Card className="space-y-3 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#737973]">Create Circle</p>
              <div className="grid gap-2 xl:grid-cols-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Room name" />
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  disabled={busyCreate}
                  onClick={async () => {
                    setCreateError(null);
                    setBusyCreate(true);
                    try {
                      await onCreateRoom(name, description);
                      setName("");
                      setDescription("");
                    } catch (err) {
                      setCreateError(err instanceof Error ? err.message : "Failed to create room.");
                    } finally {
                      setBusyCreate(false);
                    }
                  }}
                >
                  {busyCreate ? "Creating..." : "Create room"}
                </Button>
                {createError ? <p className="text-xs text-rose-700">{createError}</p> : null}
              </div>
            </Card>
          </div>
        </section>

        <section className={`${showList ? "hidden xl:block" : "block"}`}>
          {!showList && (
            <button
              type="button"
              className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#633D3A] xl:hidden"
              onClick={() => setShowList(true)}
            >
              <span>←</span> Back to Circles
            </button>
          )}
          {active ? <ChatRoom room={active} languageCode={languageCode} /> : null}
        </section>
      </div>
    </div>
  );
}
