import axios from "axios";
import type {
  Document,
  PaginatedDocuments,
  DocumentListItem,
  Supplier,
  ComplianceAlert,
  DashboardStats,
  FraudRule,
  FraudRuleCreate,
  FraudRuleUpdate,
  AnalyticsData,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour les erreurs globales
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail ?? error.message;
    return Promise.reject(new Error(message));
  }
);

// ── Documents ──────────────────────────────────────────────────────────────

export const documentsApi = {
  list: async (params?: {
    page?: number;
    per_page?: number;
    status?: string;
    file_type?: string;
    supplier_siren?: string;
  }): Promise<PaginatedDocuments> => {
    const res = await apiClient.get("/documents", { params });
    return res.data;
  },

  get: async (id: string): Promise<Document> => {
    const res = await apiClient.get(`/documents/${id}`);
    return res.data;
  },

  getStatus: async (id: string): Promise<{ id: string; status: string; error_message: string | null }> => {
    const res = await apiClient.get(`/documents/${id}/status`);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },

  reprocess: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/documents/${id}/reprocess`);
    return res.data;
  },
};

// ── Upload ─────────────────────────────────────────────────────────────────

export const uploadApi = {
  upload: async (
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<Array<{ id: string; status: string }>> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const res = await apiClient.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return res.data;
  },
};

// ── Fournisseurs ───────────────────────────────────────────────────────────

export const suppliersApi = {
  list: async (params?: { skip?: number; limit?: number }): Promise<Supplier[]> => {
    const res = await apiClient.get("/suppliers", { params });
    return res.data;
  },

  get: async (siren: string): Promise<Supplier> => {
    const res = await apiClient.get(`/suppliers/${siren}`);
    return res.data;
  },

  getDocuments: async (siren: string): Promise<DocumentListItem[]> => {
    const res = await apiClient.get(`/suppliers/${siren}/documents`);
    return res.data;
  },
};

// ── Conformité ─────────────────────────────────────────────────────────────

export const complianceApi = {
  listAlerts: async (params?: {
    status?: string;
    severity?: string;
    document_id?: string;
    skip?: number;
    limit?: number;
  }): Promise<ComplianceAlert[]> => {
    const res = await apiClient.get("/compliance/alerts", { params });
    return res.data;
  },

  updateAlert: async (
    id: string,
    status: "RESOLVED" | "FALSE_POSITIVE" | "OPEN"
  ): Promise<ComplianceAlert> => {
    const res = await apiClient.patch(`/compliance/alerts/${id}`, { status });
    return res.data;
  },
};

// ── Règles de fraude ───────────────────────────────────────────────────────

export const fraudRulesApi = {
  list: async (params?: {
    category?: string;
    sector?: string;
    active?: boolean;
  }): Promise<FraudRule[]> => {
    const res = await apiClient.get("/fraud-rules", { params });
    return res.data;
  },

  create: async (payload: FraudRuleCreate): Promise<FraudRule> => {
    const res = await apiClient.post("/fraud-rules", payload);
    return res.data;
  },

  update: async (id: string, payload: FraudRuleUpdate): Promise<FraudRule> => {
    const res = await apiClient.patch(`/fraud-rules/${id}`, payload);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/fraud-rules/${id}`);
  },

  seedBuiltin: async (): Promise<{ message: string; total: number }> => {
    const res = await apiClient.post("/fraud-rules/seed/builtin");
    return res.data;
  },

  seedSector: async (sector: string): Promise<{ message: string; sector: string; total_available: number }> => {
    const res = await apiClient.post(`/fraud-rules/seed/${sector}`);
    return res.data;
  },
};

// ── Export ─────────────────────────────────────────────────────────────────

export const exportApi = {
  documentPdf: (id: string) => {
    window.open(`${API_URL}/api/documents/${id}/export/pdf`, "_blank");
  },
  complianceExcel: () => {
    window.open(`${API_URL}/api/compliance/export/excel`, "_blank");
  },
  suppliersExcel: () => {
    window.open(`${API_URL}/api/suppliers/export/excel`, "_blank");
  },
};

// ── Stats ──────────────────────────────────────────────────────────────────

export const statsApi = {
  get: async (): Promise<DashboardStats> => {
    const res = await apiClient.get("/stats");
    return res.data;
  },
};

// ── Analytics ──────────────────────────────────────────────────────────────

export const analyticsApi = {
  get: async (months = 6): Promise<AnalyticsData> => {
    const res = await apiClient.get("/analytics", { params: { months } });
    return res.data;
  },
};
