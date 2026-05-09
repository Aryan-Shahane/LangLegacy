"use client";

import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-2xl border border-[#C3C8C1] bg-[#FBF9F4] px-4 py-3 text-[#1B1C19] placeholder:text-[#737973]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9F4026]/30",
        className
      )}
      {...props}
    />
  );
}
