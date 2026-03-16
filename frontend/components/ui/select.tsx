"use client";
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function Select({ className, options, placeholder, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full appearance-none px-3 py-2 pr-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]",
          "text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/60",
          "transition-colors duration-200 text-sm cursor-pointer",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" className="bg-[var(--bg-elevated)]">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[var(--bg-elevated)]">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" />
    </div>
  );
}
