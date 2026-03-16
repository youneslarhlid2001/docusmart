"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDocuments } from "@/hooks/useDocuments";
import { useDocumentsStore } from "@/lib/store";
import type { DocumentListItem } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "UPLOADED", label: "Uploadé" },
  { value: "DONE", label: "Traité" },
  { value: "ERROR", label: "Erreur" },
  { value: "OCR_PROCESSING", label: "En cours" },
];

const TYPE_OPTIONS = [
  { value: "", label: "Tous les types" },
  { value: "FACTURE", label: "Facture" },
  { value: "DEVIS", label: "Devis" },
  { value: "ATTESTATION_URSSAF", label: "Attestation URSSAF" },
  { value: "ATTESTATION_FISCALE", label: "Attestation Fiscale" },
  { value: "BON_COMMANDE", label: "Bon de Commande" },
  { value: "CONTRAT", label: "Contrat" },
];

export default function DocumentsPage() {
  const router = useRouter();
  const { filters, setFilters, clearFilters } = useDocumentsStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useDocuments({
    page,
    per_page: 20,
    status: filters.status,
    file_type: filters.file_type,
    supplier_siren: filters.supplier_siren,
  });

  const filteredItems = data?.items.filter((doc) =>
    search === "" || doc.original_name.toLowerCase().includes(search.toLowerCase()) ||
    doc.supplier_siren?.includes(search)
  ) ?? [];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] font-[Syne]">Documents</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {data?.total ?? 0} document(s) au total
          </p>
        </div>
        <Button onClick={() => router.push("/upload")}>
          Uploader des documents
        </Button>
      </motion.div>

      {/* Filtres */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 flex flex-wrap items-center gap-3"
      >
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filtres</span>
        </div>
        <div className="flex-1 min-w-[180px] max-w-xs">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="w-40">
          <Select
            options={STATUS_OPTIONS}
            value={filters.status ?? ""}
            onChange={(e) => setFilters({ status: e.target.value || undefined })}
            placeholder="Statut"
          />
        </div>
        <div className="w-48">
          <Select
            options={TYPE_OPTIONS}
            value={filters.file_type ?? ""}
            onChange={(e) => setFilters({ file_type: e.target.value || undefined })}
            placeholder="Type"
          />
        </div>
        {(filters.status || filters.file_type) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Réinitialiser
          </Button>
        )}
      </motion.div>

      {/* Grid de documents */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-[var(--text-secondary)]">
          <p>Erreur lors du chargement des documents</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <SlidersHorizontal className="w-12 h-12 mx-auto text-[var(--text-secondary)] opacity-50" />
          <p className="text-[var(--text-secondary)]">Aucun document trouvé</p>
          <Button variant="secondary" onClick={() => router.push("/upload")}>
            Uploader des documents
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filteredItems.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <DocumentCard
                document={doc}
                onClick={() => router.push(`/document/${doc.id}`)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Précédent
          </Button>
          <span className="text-sm text-[var(--text-secondary)]">
            Page {page} / {data.pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page === data.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
