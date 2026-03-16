"use client";
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUploadStore } from "@/lib/store";
import { uploadApi } from "@/lib/api";

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { addFiles, updateFile, queue } = useUploadStore();
  const queryClient = useQueryClient();

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // Ajouter les fichiers à la queue avec statut "pending"
      addFiles(files);
      setIsUploading(true);

      // Récupérer les IDs générés
      const state = useUploadStore.getState();
      const newIds = state.queue
        .slice(-files.length)
        .map((f) => f.id);

      // Mettre à jour le statut à "uploading"
      newIds.forEach((id) => updateFile(id, { status: "uploading", progress: 0 }));

      try {
        const results = await uploadApi.upload(files, (progress) => {
          newIds.forEach((id) => updateFile(id, { progress }));
        });

        // Associer les documents créés aux fichiers de la queue
        results.forEach((result, index) => {
          const fileId = newIds[index];
          if (fileId) {
            updateFile(fileId, {
              status: "processing",
              progress: 100,
              documentId: result.id,
            });
          }
        });

        // Invalider les requêtes pour rafraîchir la liste
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
      } catch (error) {
        newIds.forEach((id) =>
          updateFile(id, {
            status: "error",
            error: error instanceof Error ? error.message : "Erreur upload",
          })
        );
      } finally {
        setIsUploading(false);
      }
    },
    [addFiles, updateFile, queryClient]
  );

  return { upload, isUploading, queue };
}
