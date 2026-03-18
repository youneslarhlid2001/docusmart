"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Users,
  ShieldCheck,
  Zap,
  ChevronRight,
  Network,
  SlidersHorizontal,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/crm", label: "Fournisseurs", icon: Users },
  { href: "/compliance", label: "Conformité", icon: ShieldCheck },
  { href: "/rules", label: "Règles fraude", icon: SlidersHorizontal },
  { href: "/analytics", label: "Analytique", icon: BarChart3 },
  { href: "/architecture", label: "Architecture", icon: Network },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-[var(--border)]"
        style={{ background: "var(--bg-secondary)", backdropFilter: "blur(20px)" }}>
        {/* Logo */}
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-[var(--text-primary)] font-[Syne]">
              DocuSmart
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 ml-11">
            IA documentaire
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isActive ? "text-indigo-400" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                  )} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="w-3 h-3 ml-auto text-indigo-400" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/40 to-cyan-500/40 flex items-center justify-center border border-indigo-500/30">
              <span className="text-xs font-bold text-indigo-300">DS</span>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-primary)]">DocuSmart</p>
              <p className="text-xs text-[var(--text-secondary)]">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Topbar */}
        <div className="flex-shrink-0 h-14 flex items-center justify-end px-6 border-b border-[var(--border)]"
          style={{ background: "var(--bg-secondary)", backdropFilter: "blur(20px)" }}>
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
