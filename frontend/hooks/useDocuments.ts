"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi, complianceApi, statsApi, suppliersApi, analyticsApi } from "@/lib/api";
import { useDocumentsStore } from "@/lib/store";

export function useDocuments(params?: {
  page?: number;
  per_page?: number;
  status?: string;
  file_type?: string;
  supplier_siren?: string;
}) {
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => documentsApi.list(params),
    refetchInterval: 5000, // Polling toutes les 5s pour les mises à jour de statut
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => documentsApi.get(id),
    enabled: !!id,
  });
}

export function useDocumentStatus(id: string, enabled = true) {
  return useQuery({
    queryKey: ["document-status", id],
    queryFn: () => documentsApi.getStatus(id),
    enabled: enabled && !!id,
    refetchInterval: 2000,
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: statsApi.get,
    refetchInterval: 10000,
  });
}

export function useAlerts(params?: { status?: string; severity?: string; document_id?: string }) {
  return useQuery({
    queryKey: ["alerts", params],
    queryFn: () => complianceApi.listAlerts(params),
    refetchInterval: 10000,
  });
}

export function useUpdateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "RESOLVED" | "FALSE_POSITIVE" | "OPEN" }) =>
      complianceApi.updateAlert(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: () => suppliersApi.list(),
  });
}

export function useSupplier(siren: string) {
  return useQuery({
    queryKey: ["supplier", siren],
    queryFn: () => suppliersApi.get(siren),
    enabled: !!siren,
  });
}

export function useSupplierDocuments(siren: string) {
  return useQuery({
    queryKey: ["supplier-documents", siren],
    queryFn: () => suppliersApi.getDocuments(siren),
    enabled: !!siren,
  });
}

export function useAnalytics(months: number = 6) {
  return useQuery({
    queryKey: ["analytics", months],
    queryFn: () => analyticsApi.get(months),
    refetchInterval: 30000,
  });
}
