"use client";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { SupplierRadarData } from "@/lib/types";

interface Props {
  data: SupplierRadarData[];
}

const COLORS = ["#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export function SupplierRadarChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-secondary)] text-sm">
        Aucun fournisseur à comparer
      </div>
    );
  }

  // Normalise les dimensions pour le radar
  const maxDocs = Math.max(...data.map((s) => s.doc_count), 1);
  const maxAlerts = Math.max(...data.map((s) => s.alert_count), 1);

  const radarData = [
    {
      subject: "Conformité",
      ...Object.fromEntries(data.map((s) => [s.name, s.compliance_score])),
      fullMark: 100,
    },
    {
      subject: "Volume docs",
      ...Object.fromEntries(data.map((s) => [s.name, Math.round((s.doc_count / maxDocs) * 100)])),
      fullMark: 100,
    },
    {
      subject: "Alertes ouvertes",
      // Inverse: moins d'alertes = meilleur score
      ...Object.fromEntries(
        data.map((s) => [s.name, Math.round((1 - s.open_alert_count / Math.max(maxAlerts, 1)) * 100)])
      ),
      fullMark: 100,
    },
    {
      subject: "Taux résolution",
      ...Object.fromEntries(
        data.map((s) => {
          const resolved = s.alert_count - s.open_alert_count;
          const rate = s.alert_count > 0 ? Math.round((resolved / s.alert_count) * 100) : 100;
          return [s.name, rate];
        })
      ),
      fullMark: 100,
    },
  ];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData}>
          <PolarGrid stroke="rgba(99,102,241,0.15)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: "#94A3B8" }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: "#64748B" }}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(15,15,20,0.95)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value}%`]}
          />
          <Legend wrapperStyle={{ fontSize: 10, color: "#94A3B8" }} />
          {data.map((s, i) => (
            <Radar
              key={s.siren}
              name={s.name}
              dataKey={s.name}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.1}
              strokeWidth={1.5}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
