import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#8C7851]/20 bg-[#FBF9F4] shadow-[0_4px_20px_-16px_rgba(32,21,0,0.45)]",
        className
      )}
      {...props}
    />
  );
}
