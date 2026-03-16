"use client";
import { motion } from "framer-motion";
import { FileText, AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn, formatDate, STATUS_LABELS, STATUS_COLORS, TYPE_LABELS, TYPE_COLORS, isProcessingStatus } from "@/lib/utils";
import type { DocumentListItem } from "@/lib/types";

interface DocumentCardProps {
  document: DocumentListItem;
  onClick?: () => void;
  hasAlert?: boolean;
}

export function DocumentCard({ document, onClick, hasAlert = false }: DocumentCardProps) {
  const isProcessing = isProcessingStatus(document.status);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "glass-card p-5 cursor-pointer transition-all duration-300 hover:border-indigo-500/30",
        hasAlert && "border-red-500/20 hover:border-red-500/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            hasAlert ? "bg-red-500/20" : "bg-indigo-500/20"
          )}>
            {hasAlert ? (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            ) : (
              <FileText className="w-5 h-5 text-indigo-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {document.original_name}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {document.supplier_siren ? `SIREN: ${document.supplier_siren}` : "Fournisseur inconnu"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {document.file_type && (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full border font-medium",
              TYPE_COLORS[document.file_type] || TYPE_COLORS.INCONNU
            )}>
              {TYPE_LABELS[document.file_type] || document.file_type}
            </span>
          )}
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full border",
            STATUS_COLORS[document.status],
            isProcessing && "status-processing"
          )}>
            {isProcessing ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {STATUS_LABELS[document.status]}
              </span>
            ) : document.status === "DONE" ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {STATUS_LABELS[document.status]}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {STATUS_LABELS[document.status]}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--border)] flex justify-between text-xs text-[var(--text-secondary)]">
        <span>Créé le {formatDate(document.created_at)}</span>
        {document.classification_confidence && (
          <span className="text-indigo-400">
            Confiance : {Math.round(document.classification_confidence * 100)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}
