"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-full border border-[#C3C8C1] bg-[#FBF9F4] px-4 py-2 text-[#1B1C19] placeholder:text-[#737973]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9F4026]/30",
        className
      )}
      {...props}
    />
  );
}
