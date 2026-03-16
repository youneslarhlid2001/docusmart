"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Trash2 } from "lucide-react";
import { DropZone } from "@/components/upload/DropZone";
import { FileQueue } from "@/components/upload/FileQueue";
import { PipelineVisualizer } from "@/components/upload/PipelineVisualizer";
import { Button } from "@/components/ui/button";
import { useUpload } from "@/hooks/useUpload";
import { useUploadStore } from "@/lib/store";
import { useDocumentStatus } from "@/hooks/useDocuments";

// Composant de surveillance du statut pour chaque document en processing
function StatusWatcher({ documentId, fileId }: { documentId: string; fileId: string }) {
  const { data } = useDocumentStatus(documentId);
  const updateFile = useUploadStore((s) => s.updateFile);

  useEffect(() => {
    if (!data) return;
    if (data.status === "DONE") {
      updateFile(fileId, { status: "done", progress: 100 });
    } else if (data.status === "ERROR") {
      updateFile(fileId, { status: "error", error: data.error_message ?? "Erreur de traitement" });
    }
  }, [data, fileId, updateFile]);

  return null;
}

export default function UploadPage() {
  const { upload, isUploading } = useUpload();
  const { queue, removeFile, clearCompleted } = useUploadStore();

  const processingFiles = queue.filter((f) => f.status === "processing" && f.documentId);
  const hasCompleted = queue.some((f) => f.status === "done" || f.status === "error");

  // Affiche le visualiseur pour le document le plus récent en traitement
  // (ou le dernier traité s'il n'y en a plus en cours)
  const activeFile =
    processingFiles[processingFiles.length - 1] ??
    queue.filter((f) => f.documentId).slice(-1)[0] ??
    null;

  const showVisualizer = queue.length > 0 && !!activeFile?.documentId;

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] font-[Syne]">
          Upload de documents
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Déposez vos factures, devis et attestations pour traitement automatique
        </p>
      </motion.div>

      {/* Zone de drop */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <DropZone onFilesAccepted={upload} disabled={isUploading} />
      </motion.div>

      {/* File Queue */}
      {queue.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] font-[Syne]">
              Documents en cours
            </h2>
            {hasCompleted && (
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
                <Trash2 className="w-4 h-4" />
                Nettoyer
              </Button>
            )}
          </div>

          <FileQueue files={queue} onRemove={removeFile} />

          {/* Watchers de statut pour les documents en traitement */}
          {processingFiles.map((f) => (
            <StatusWatcher key={f.id} documentId={f.documentId!} fileId={f.id} />
          ))}

          {hasCompleted && (
            <a href="/documents" className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium rounded-lg bg-[var(--bg-elevated)] hover:bg-[#22223a] text-[var(--text-primary)] border border-[var(--border)] transition-all duration-200">
              <Link2 className="w-4 h-4" />
              Voir tous les documents
            </a>
          )}
        </motion.div>
      )}

      {/* Pipeline Visualizer — bloc interactif temps réel */}
      <AnimatePresence>
        {showVisualizer && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] font-[Syne]">
                Ce qui se passe en coulisses
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Suivi en temps réel du traitement IA —{" "}
                <span className="text-indigo-400">{activeFile?.file?.name}</span>
              </p>
            </div>
            <PipelineVisualizer documentId={activeFile?.documentId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
