"use client";

import { useCallback, useEffect, useRef, useState } from "react";

let sharedPlaying: HTMLAudioElement | null = null;

function pauseAllExcept(candidate: HTMLAudioElement | null) {
  if (sharedPlaying && sharedPlaying !== candidate) {
    sharedPlaying.pause();
  }
}

export function useExclusivePlayback(audioUrl: string | null | undefined) {
  const url = audioUrl || null;
  const internalRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      const el = internalRef.current;
      if (!el) return;
      if (sharedPlaying === el) {
        sharedPlaying = null;
      }
      el.pause();
      internalRef.current = null;
    };
  }, []);

  useEffect(() => {
    const el = internalRef.current;
    if (el) {
      el.pause();
      internalRef.current = null;
      if (sharedPlaying === el) sharedPlaying = null;
    }
    setIsPlaying(false);
  }, [url]);

  const toggle = useCallback(() => {
    if (!url) return;

    if (!internalRef.current) {
      const el = new Audio(url);
      el.onended = () => {
        setIsPlaying(false);
        if (sharedPlaying === el) sharedPlaying = null;
      };
      internalRef.current = el;
    }

    const current = internalRef.current;
    if (!current) return;

    pauseAllExcept(current);

    if (current.paused) {
      sharedPlaying = current;
      void current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      current.pause();
      setIsPlaying(false);
      if (sharedPlaying === current) sharedPlaying = null;
    }
  }, [url]);

  return { isPlaying: url ? isPlaying : false, toggle, hasAudio: Boolean(url) };
}
