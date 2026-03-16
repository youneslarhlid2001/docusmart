"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { ComplianceTrendPoint } from "@/lib/types";

interface Props {
  data: ComplianceTrendPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-indigo-500/30 space-y-1">
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {p.value}
            {p.dataKey === "compliance_rate" ? "%" : ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ComplianceTrendChart({ data }: Props) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="complianceGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="rate"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            yAxisId="count"
            orientation="right"
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#94A3B8" }}
          />
          <ReferenceLine yAxisId="rate" y={80} stroke="#EF4444" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="compliance_rate"
            name="Taux conformité"
            stroke="#6366F1"
            strokeWidth={2.5}
            dot={{ fill: "#6366F1", r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="count"
            type="monotone"
            dataKey="alerts_count"
            name="Alertes"
            stroke="#F59E0B"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
          />
          <Line
            yAxisId="count"
            type="monotone"
            dataKey="documents_count"
            name="Documents traités"
            stroke="#06B6D4"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
