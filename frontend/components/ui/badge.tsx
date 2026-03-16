import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "danger" | "warning" | "processing";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variant === "default" && "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        variant === "success" && "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        variant === "danger" && "bg-red-500/20 text-red-300 border-red-500/30",
        variant === "warning" && "bg-amber-500/20 text-amber-300 border-amber-500/30",
        variant === "processing" && "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 status-processing",
        className
      )}
      {...props}
    />
  );
}
