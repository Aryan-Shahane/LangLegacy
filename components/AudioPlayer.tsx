"use client";

import { useEffect, useRef, useState } from "react";

let currentAudio: HTMLAudioElement | null = null;

export default function AudioPlayer({ src, word }: { src: string; word: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (currentAudio && currentAudio !== audioRef.current) {
      currentAudio.pause();
    }
    currentAudio = audioRef.current;

    if (audioRef.current.paused) {
      void audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded bg-cyan-700 px-3 py-2 text-sm hover:bg-cyan-600"
      aria-label={`Play audio for ${word}`}
    >
      {isPlaying ? "Pause" : "Play"} audio
    </button>
  );
}
