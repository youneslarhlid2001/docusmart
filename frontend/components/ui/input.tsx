import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]",
        "text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]",
        "focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30",
        "transition-colors duration-200 text-sm",
        className
      )}
      {...props}
    />
  );
}
