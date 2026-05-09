"use client";

import { useState } from "react";
import ChatRoom from "@/components/ChatRoom";
import type { Room, UserRole } from "@/lib/types";

export default function RoomList({
  rooms,
  languageCode,
  viewerRole,
  onCreateRoom,
}: {
  rooms: Room[];
  languageCode: string;
  viewerRole: UserRole;
  onCreateRoom: (name: string, description: string) => Promise<void>;
}) {
  const [activeId, setActiveId] = useState<string>(rooms[0]?._id || "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const active = rooms.find((r) => r._id === activeId) || rooms[0] || null;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <button
            key={room._id}
            type="button"
            onClick={() => setActiveId(room._id)}
            className={`rounded border px-3 py-2 text-left ${
              room._id === active?._id ? "border-cyan-600 bg-cyan-950/30" : "border-slate-800 bg-slate-900"
            }`}
          >
            <p className="text-sm font-medium text-slate-100">{room.name}</p>
            <p className="text-xs text-slate-500">{room.description}</p>
          </button>
        ))}
      </div>
      {(viewerRole === "moderator" || viewerRole === "admin") && (
        <div className="panel space-y-2">
          <p className="text-xs font-medium text-slate-300">Create room (moderator)</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Room name"
            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5"
          />
          <button
            type="button"
            onClick={() => void onCreateRoom(name, description)}
            className="rounded bg-amber-700 px-3 py-1.5 text-sm hover:bg-amber-600"
          >
            Create room
          </button>
        </div>
      )}
      {active ? <ChatRoom room={active} languageCode={languageCode} /> : null}
    </div>
  );
}
