"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { FieldWithConfidence } from "@/lib/types";

interface ExtractionField {
  key: string;
  label: string;
  value: FieldWithConfidence | null | undefined;
  mono?: boolean;
}

interface ExtractionPanelProps {
  fields: ExtractionField[];
  title?: string;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  return (
    <span className={cn(
      "text-xs px-1.5 py-0.5 rounded font-[JetBrains_Mono] font-medium",
      pct >= 80 ? "bg-emerald-500/20 text-emerald-400" :
      pct >= 50 ? "bg-amber-500/20 text-amber-400" :
      "bg-red-500/20 text-red-400"
    )}>
      {pct}%
    </span>
  );
}

export function ExtractionPanel({ fields, title = "Données extraites" }: ExtractionPanelProps) {
  const filledFields = fields.filter((f) => f.value?.value);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-[Syne]">
        {title}
      </h3>
      <div className="space-y-2">
        {fields.map((field, i) => (
          <motion.div
            key={field.key}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg",
              field.value?.value
                ? "bg-[var(--bg-elevated)] border border-[var(--border)]"
                : "bg-[var(--bg-secondary)] border border-[var(--border)] opacity-40"
            )}
          >
            <span className="text-xs text-[var(--text-secondary)] w-36 flex-shrink-0">
              {field.label}
            </span>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className={cn(
                "text-sm text-right truncate max-w-[200px]",
                field.mono ? "font-[JetBrains_Mono] text-cyan-300" : "text-[var(--text-primary)]",
                !field.value?.value && "text-[var(--text-secondary)] italic"
              )}>
                {field.value?.value ?? "Non détecté"}
              </span>
              {field.value?.confidence !== undefined && field.value?.value && (
                <ConfidenceBadge confidence={field.value.confidence} />
              )}
            </div>
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-[var(--text-secondary)]">
        {filledFields.length}/{fields.length} champs détectés
      </p>
    </div>
  );
}
