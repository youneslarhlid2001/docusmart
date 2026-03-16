"use client";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, CheckCircle, XCircle, Loader2, X } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import type { UploadedFile } from "@/lib/types";

interface FileQueueProps {
  files: UploadedFile[];
  onRemove: (id: string) => void;
}

const PIPELINE_STEPS = ["Upload", "OCR", "Classification", "Extraction", "Vérification"];

function PipelineProgress({ progress, status }: { progress: number; status: UploadedFile["status"] }) {
  if (status === "done") {
    return (
      <div className="flex items-center gap-1 mt-2">
        {PIPELINE_STEPS.map((step) => (
          <div key={step} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-emerald-400">{step}</span>
            {step !== PIPELINE_STEPS[PIPELINE_STEPS.length - 1] && (
              <div className="w-4 h-px bg-emerald-500/50" />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
        <span>{status === "uploading" ? "Upload en cours..." : "Traitement IA..."}</span>
        <span>{progress}%</span>
      </div>
      <div className="h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full progress-bar-animated"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

export function FileQueue({ files, onRemove }: FileQueueProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-[var(--text-secondary)] font-[Syne]">
        File de traitement ({files.length})
      </h3>
      <AnimatePresence>
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="glass-card p-4 flex items-start gap-3"
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              file.status === "done" ? "bg-emerald-500/20" :
              file.status === "error" ? "bg-red-500/20" :
              "bg-indigo-500/20"
            )}>
              {file.status === "done" ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : file.status === "error" ? (
                <XCircle className="w-4 h-4 text-red-400" />
              ) : file.status === "uploading" || file.status === "processing" ? (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 text-indigo-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-[var(--text-primary)] truncate font-medium">
                  {file.file.name}
                </span>
                <span className="text-xs text-[var(--text-secondary)] flex-shrink-0">
                  {formatFileSize(file.file.size)}
                </span>
              </div>

              {file.status === "error" ? (
                <p className="text-xs text-red-400 mt-1">{file.error}</p>
              ) : (
                <PipelineProgress progress={file.progress} status={file.status} />
              )}
            </div>

            {(file.status === "done" || file.status === "error" || file.status === "pending") && (
              <button
                onClick={() => onRemove(file.id)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
