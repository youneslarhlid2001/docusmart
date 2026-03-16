"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/utils";

interface DropZoneProps {
  onFilesAccepted: (files: File[]) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/tiff": [".tiff", ".tif"],
};

export function DropZone({ onFilesAccepted, disabled = false }: DropZoneProps) {
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setRejectedFiles([]);
      if (acceptedFiles.length > 0) {
        onFilesAccepted(acceptedFiles);
      }
    },
    [onFilesAccepted]
  );

  const onDropRejected = useCallback((fileRejections: any[]) => {
    setRejectedFiles(fileRejections.map((r) => r.file.name));
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPTED_TYPES,
    maxSize: 50 * 1024 * 1024,
    disabled,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300",
          "flex flex-col items-center justify-center gap-4 min-h-[280px]",
          "hover:scale-[1.01] active:scale-[0.99]",
          isDragActive && !isDragReject
            ? "border-indigo-500 bg-indigo-500/10 glow"
            : isDragReject
            ? "border-red-500 bg-red-500/10"
            : "border-[var(--border)] hover:border-indigo-500/50 hover:bg-indigo-500/5",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />

        {/* Gradient mesh background */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl"
              style={{ background: "var(--accent-primary)" }}
            />
            <div
              className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl"
              style={{ background: "var(--accent-secondary)" }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isDragActive && !isDragReject ? (
            <motion.div
              key="active"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center glow">
                <Upload className="w-8 h-8 text-indigo-400" />
              </div>
              <p className="text-indigo-300 font-semibold text-lg font-[Syne]">
                Déposez vos documents ici
              </p>
            </motion.div>
          ) : isDragReject ? (
            <motion.div
              key="reject"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <AlertCircle className="w-16 h-16 text-red-400" />
              <p className="text-red-400 font-semibold text-lg">Format non supporté</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 relative z-10"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-cyan-500/20 flex items-center justify-center border border-indigo-500/30"
              >
                <FileText className="w-10 h-10 text-indigo-400" />
              </motion.div>

              <div className="space-y-2">
                <p className="text-[var(--text-primary)] font-semibold text-xl font-[Syne]">
                  Glissez vos documents ici
                </p>
                <p className="text-[var(--text-secondary)] text-sm">
                  ou{" "}
                  <span className="text-indigo-400 hover:text-indigo-300 cursor-pointer">
                    cliquez pour parcourir
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border)]">PDF</span>
                <span className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border)]">PNG</span>
                <span className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border)]">JPG</span>
                <span className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border)]">TIFF</span>
                <span className="text-[var(--text-secondary)]">· max 50 MB</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {rejectedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {rejectedFiles.length} fichier(s) rejeté(s) : format non supporté ou taille dépassée
          </span>
        </motion.div>
      )}
    </div>
  );
}
