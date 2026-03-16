"use client";
import { motion } from "framer-motion";
import { FileText, CheckCircle, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import type { DashboardStats } from "@/lib/types";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Documents traités",
      value: stats.documents_done,
      total: stats.total_documents,
      icon: FileText,
      color: "indigo",
      gradient: "from-indigo-500/20 to-violet-500/10",
    },
    {
      title: "Taux de conformité",
      value: `${stats.compliance_rate}%`,
      subtitle: `${stats.total_documents} documents analysés`,
      icon: TrendingUp,
      color: "emerald",
      gradient: "from-emerald-500/20 to-teal-500/10",
    },
    {
      title: "Alertes actives",
      value: stats.open_alerts,
      total: stats.total_alerts,
      icon: AlertTriangle,
      color: "red",
      gradient: "from-red-500/20 to-orange-500/10",
    },
    {
      title: "En cours",
      value: stats.documents_processing,
      subtitle: `${stats.documents_error} erreur(s)`,
      icon: Clock,
      color: "amber",
      gradient: "from-amber-500/20 to-yellow-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`glass-card p-5 bg-gradient-to-br ${card.gradient}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-[Syne] uppercase tracking-wider">
                {card.title}
              </p>
              <p className="text-3xl font-bold text-[var(--text-primary)] mt-1 font-[Syne]">
                {card.value}
              </p>
              {card.total !== undefined && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  sur {card.total} total
                </p>
              )}
              {card.subtitle && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">{card.subtitle}</p>
              )}
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${card.color}-500/20`}>
              <card.icon className={`w-5 h-5 text-${card.color}-400`} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
