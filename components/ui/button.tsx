"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "pill";
type Size = "sm" | "md" | "lg";

const variantStyles: Record<Variant, string> = {
  primary: "bg-[#9F4026] text-white hover:bg-[#8A371F] active:scale-[0.98]",
  ghost: "bg-transparent text-[#434843] hover:bg-[#ECE7DE]",
  outline: "border border-[#C3C8C1] bg-[#FBF9F4] text-[#1B1C19] hover:bg-[#F0EEE9]",
  pill: "rounded-full bg-[#D0E9D4] text-[#0B2013] hover:bg-[#B4CDB8]",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
  children: ReactNode;
};

export function Button({ className, variant = "primary", size = "md", children, ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9F4026]/40",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
