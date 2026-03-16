import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" &&
          "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40",
        variant === "secondary" &&
          "bg-[var(--bg-elevated)] hover:bg-[#22223a] text-[var(--text-primary)] border border-[var(--border)]",
        variant === "ghost" &&
          "hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        variant === "danger" &&
          "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30",
        variant === "outline" &&
          "border border-[var(--border)] hover:border-indigo-500/50 text-[var(--text-primary)] hover:bg-indigo-500/10",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        className
      )}
      {...props}
    />
  );
}
