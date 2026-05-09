"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "langlegacy_notifications_v1";

export type StoredNotification = { id: string; title: string; read: boolean; createdAt?: string };

function loadNotifications(): StoredNotification[] {
  if (typeof window === "undefined") return [{ id: "welcome", title: "Welcome to LangLegacy", read: false }];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredNotification[];
  } catch {
    /* fallback */
  }
  return [{ id: "welcome", title: "Welcome to LangLegacy", read: false }];
}

function persist(items: StoredNotification[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<StoredNotification[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage on mount
    setItems(loadNotifications());
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const unreadCount = items.filter((i) => !i.read).length;

  const update = useCallback((next: StoredNotification[]) => {
    setItems(next);
    persist(next);
  }, []);

  const markAllRead = () => update(items.map((i) => ({ ...i, read: true })));
  const markAllUnread = () => update(items.map((i) => ({ ...i, read: false })));

  const toggleOne = (id: string) => {
    update(
      items.map((i) => (i.id === id ? { ...i, read: !i.read } : i))
    );
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-10 w-10 place-content-center rounded-full border border-[#C3C8C1]/25 bg-[#31493B] text-lg transition hover:bg-[#3a5848]"
      >
        <span aria-hidden>🔔</span>
        {unreadCount > 0 ? (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#C4622D] ring-2 ring-[#31493B]" />
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-[#C3C8C1]/25 bg-[#22382B] py-2 shadow-xl ring-1 ring-black/15"
        >
          <div className="border-b border-[#C3C8C1]/15 px-4 py-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9AACA0]">Notifications</p>
            <p className="text-[11px] text-[#B4CDB8]/80">{unreadCount} unread</p>
          </div>

          <ul className="max-h-52 overflow-y-auto py-2 text-sm">
            {items.length === 0 ? (
              <li className="px-4 py-3 text-[#C8BBAD]">No messages.</li>
            ) : (
              items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="menuitem"
                    className={cn(
                      "flex w-full items-start gap-2 px-4 py-2 text-left text-[#E8EDE9] hover:bg-[#30483A]",
                      !item.read ? "bg-[#1b2e24]/70" : "opacity-80"
                    )}
                    onClick={() => toggleOne(item.id)}
                  >
                    <span className={cn("mt-1 inline-block h-2 w-2 shrink-0 rounded-full", item.read ? "bg-[#5A7264]" : "bg-[#B4CDB8]")} />
                    <span>{item.title}</span>
                  </button>
                </li>
              ))
            )}
          </ul>

          <div className="border-t border-[#C3C8C1]/15 px-2 py-2" role="group" aria-label="Bulk actions">
            <button
              type="button"
              role="menuitem"
              className="w-full rounded px-3 py-2 text-left text-sm text-[#D0E9D4] hover:bg-[#30483A]"
              onClick={() => {
                markAllRead();
                setOpen(false);
              }}
            >
              Mark all as read
            </button>
            <button
              type="button"
              role="menuitem"
              className="w-full rounded px-3 py-2 text-left text-sm text-[#D0E9D4] hover:bg-[#30483A]"
              onClick={() => {
                markAllUnread();
              }}
            >
              Mark all as unread
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
