import { create } from "zustand";
import type { UploadedFile, DocumentListItem } from "./types";

interface UploadState {
  queue: UploadedFile[];
  addFiles: (files: File[]) => void;
  updateFile: (id: string, updates: Partial<UploadedFile>) => void;
  removeFile: (id: string) => void;
  clearCompleted: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  queue: [],

  addFiles: (files) =>
    set((state) => ({
      queue: [
        ...state.queue,
        ...files.map((file) => ({
          id: `${Date.now()}-${Math.random()}`,
          file,
          progress: 0,
          status: "pending" as const,
        })),
      ],
    })),

  updateFile: (id, updates) =>
    set((state) => ({
      queue: state.queue.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),

  removeFile: (id) =>
    set((state) => ({
      queue: state.queue.filter((f) => f.id !== id),
    })),

  clearCompleted: () =>
    set((state) => ({
      queue: state.queue.filter((f) => f.status !== "done" && f.status !== "error"),
    })),
}));

interface DocumentsState {
  selectedDocument: DocumentListItem | null;
  setSelectedDocument: (doc: DocumentListItem | null) => void;
  filters: {
    status?: string;
    file_type?: string;
    supplier_siren?: string;
  };
  setFilters: (filters: Partial<DocumentsState["filters"]>) => void;
  clearFilters: () => void;
}

export const useDocumentsStore = create<DocumentsState>((set) => ({
  selectedDocument: null,
  setSelectedDocument: (doc) => set({ selectedDocument: doc }),
  filters: {},
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: {} }),
}));
