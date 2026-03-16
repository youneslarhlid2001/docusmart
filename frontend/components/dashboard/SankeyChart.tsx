"use client";
import { Sankey, Tooltip, ResponsiveContainer } from "recharts";
import type { SankeyData } from "@/lib/types";

interface Props {
  data: SankeyData;
}

const NODE_COLORS: Record<string, string> = {
  FACTURE: "#6366F1",
  DEVIS: "#06B6D4",
  ATTESTATION_URSSAF: "#10B981",
  ATTESTATION_FISCALE: "#8B5CF6",
  BON_COMMANDE: "#F59E0B",
  CONTRAT: "#EC4899",
  INCONNU: "#64748B",
  SIRET_MISMATCH: "#F59E0B",
  TVA_ERROR: "#EF4444",
  IBAN_CONFLICT: "#8B5CF6",
  DUPLICATE_INVOICE: "#06B6D4",
  DATE_EXPIRED: "#F97316",
  AMOUNT_SUSPICIOUS: "#EF4444",
  LOW: "#22C55E",
  MEDIUM: "#F59E0B",
  HIGH: "#F97316",
  CRITICAL: "#EF4444",
};

const CustomNode = ({ x, y, width, height, index, payload }: any) => {
  const color = NODE_COLORS[payload.name] ?? "#6366F1";
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        fillOpacity={0.8}
        rx={3}
      />
      <text
        x={x + width + 6}
        y={y + height / 2}
        dy="0.35em"
        fontSize={10}
        fill="#94A3B8"
        textAnchor="start"
      >
        {payload.name}
      </text>
    </g>
  );
};

const CustomLink = ({ sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index, payload }: any) => {
  const color = NODE_COLORS[payload.source.name] ?? "#6366F1";
  return (
    <path
      d={`M${sourceX},${sourceY + linkWidth / 2}
         C${sourceControlX},${sourceY + linkWidth / 2}
           ${targetControlX},${targetY + linkWidth / 2}
           ${targetX},${targetY + linkWidth / 2}
         L${targetX},${targetY - linkWidth / 2}
         C${targetControlX},${targetY - linkWidth / 2}
           ${sourceControlX},${sourceY - linkWidth / 2}
           ${sourceX},${sourceY - linkWidth / 2}
         Z`}
      fill={color}
      fillOpacity={0.15}
      stroke={color}
      strokeOpacity={0.3}
      strokeWidth={0.5}
    />
  );
};

export function SankeyChart({ data }: Props) {
  if (!data.nodes.length || !data.links.length) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-secondary)] text-sm">
        Pas assez de données pour afficher le flux documentaire
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={data}
          nodePadding={20}
          nodeWidth={10}
          margin={{ top: 10, right: 120, bottom: 10, left: 10 }}
          node={<CustomNode />}
          link={<CustomLink />}
        >
          <Tooltip
            contentStyle={{
              background: "rgba(15,15,20,0.95)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}
