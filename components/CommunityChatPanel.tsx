"use client";

import { useCallback, useEffect, useState } from "react";
import RoomList from "@/components/chat/RoomList";
import type { Room, UserRole } from "@/lib/types";

export default function CommunityChatPanel({
  languageCode,
  viewerRole,
}: {
  languageCode: string;
  viewerRole: UserRole;
}) {
  const [rooms, setRooms] = useState<Room[]>([]);

  const loadRooms = useCallback(async () => {
    const res = await fetch(`/api/rooms?language_code=${encodeURIComponent(languageCode)}`, { cache: "no-store" });
    if (!res.ok) return;
    setRooms((await res.json()) as Room[]);
  }, [languageCode]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chat section loads rooms once mounted
    void loadRooms();
  }, [loadRooms]);

  return (
    <RoomList
      rooms={rooms}
      languageCode={languageCode}
      viewerRole={viewerRole}
      onCreateRoom={async (name, description) => {
        const res = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language_code: languageCode, name, description }),
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error || "Failed to create room.");
        }
        await loadRooms();
      }}
    />
  );
}
