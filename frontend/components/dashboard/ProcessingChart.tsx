"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProcessingChartProps {
  data: Array<{ date: string; count: number }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-indigo-500/30">
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
        <p className="text-sm font-semibold text-indigo-300">
          {payload[0].value} document(s)
        </p>
      </div>
    );
  }
  return null;
};

export function ProcessingChart({ data }: ProcessingChartProps) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            tickFormatter={(v) => v.slice(5)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#6366F1"
            strokeWidth={2}
            fill="url(#colorDocs)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
