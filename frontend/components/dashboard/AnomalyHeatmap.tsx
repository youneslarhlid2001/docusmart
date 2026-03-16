"use client";
import { useMemo } from "react";
import type { HeatmapCell } from "@/lib/types";

interface Props {
  data: HeatmapCell[];
}

const DOC_TYPE_LABELS: Record<string, string> = {
  FACTURE: "Facture",
  DEVIS: "Devis",
  ATTESTATION_URSSAF: "URSSAF",
  ATTESTATION_FISCALE: "Attestation fiscale",
  BON_COMMANDE: "Bon commande",
  CONTRAT: "Contrat",
  INCONNU: "Inconnu",
};

function cellColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "rgba(99,102,241,0.05)";
  const ratio = value / max;
  if (ratio < 0.25) return "rgba(99,102,241,0.2)";
  if (ratio < 0.5) return "rgba(245,158,11,0.35)";
  if (ratio < 0.75) return "rgba(239,68,68,0.45)";
  return "rgba(239,68,68,0.75)";
}

export function AnomalyHeatmap({ data }: Props) {
  const { months, docTypes, matrix, maxVal } = useMemo(() => {
    const monthsSet = new Set<string>();
    const typesSet = new Set<string>();
    const lookup: Record<string, number> = {};

    for (const cell of data) {
      monthsSet.add(cell.month);
      typesSet.add(cell.doc_type);
      lookup[`${cell.month}__${cell.doc_type}`] = cell.count;
    }

    const months = Array.from(monthsSet).sort();
    const docTypes = Array.from(typesSet).sort();
    const maxVal = Math.max(...data.map((c) => c.count), 1);

    return { months, docTypes, matrix: lookup, maxVal };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-[var(--text-secondary)] text-sm">
        Aucune anomalie sur la période
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left text-[var(--text-secondary)] pb-2 pr-3 font-normal w-32">Type</th>
            {months.map((m) => (
              <th key={m} className="text-center text-[var(--text-secondary)] pb-2 px-1 font-normal min-w-[52px]">
                {m.slice(5)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="space-y-1">
          {docTypes.map((dt) => (
            <tr key={dt}>
              <td className="text-[var(--text-secondary)] pr-3 py-1 font-medium truncate max-w-[120px]">
                {DOC_TYPE_LABELS[dt] ?? dt}
              </td>
              {months.map((m) => {
                const val = matrix[`${m}__${dt}`] ?? 0;
                return (
                  <td key={m} className="py-1 px-1 text-center">
                    <div
                      className="mx-auto rounded w-10 h-8 flex items-center justify-center font-mono transition-all"
                      style={{ background: cellColor(val, maxVal) }}
                      title={`${dt} — ${m}: ${val} alerte(s)`}
                    >
                      {val > 0 ? (
                        <span className="text-[var(--text-primary)]">{val}</span>
                      ) : (
                        <span className="text-[var(--text-secondary)] opacity-30">·</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-xs text-[var(--text-secondary)]">
        <span>Intensité :</span>
        {[
          { label: "0", color: "rgba(99,102,241,0.05)" },
          { label: "faible", color: "rgba(99,102,241,0.2)" },
          { label: "moyen", color: "rgba(245,158,11,0.35)" },
          { label: "élevé", color: "rgba(239,68,68,0.45)" },
          { label: "critique", color: "rgba(239,68,68,0.75)" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ background: color, border: "1px solid rgba(255,255,255,0.1)" }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
