"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
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
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  ANALYST: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  VIEWER: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const ALL_NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "ANALYST", "VIEWER"] },
  { href: "/upload", label: "Upload", icon: Upload, roles: ["ADMIN", "ANALYST", "VIEWER"] },
  { href: "/documents", label: "Documents", icon: FileText, roles: ["ADMIN", "ANALYST", "VIEWER"] },
  { href: "/crm", label: "Fournisseurs", icon: Users, roles: ["ADMIN", "ANALYST", "VIEWER"] },
  { href: "/compliance", label: "Conformité", icon: ShieldCheck, roles: ["ADMIN", "ANALYST", "VIEWER"] },
  { href: "/rules", label: "Règles fraude", icon: SlidersHorizontal, roles: ["ADMIN"] },
  { href: "/analytics", label: "Analytique", icon: BarChart3, roles: ["ADMIN", "ANALYST", "VIEWER"] },
  { href: "/architecture", label: "Architecture", icon: Network, roles: ["ADMIN", "ANALYST", "VIEWER"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role ?? "VIEWER";
  const userName = session?.user?.name ?? "Utilisateur";

  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(role));
  const initials = userName.slice(0, 2).toUpperCase();

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
          {navItems.map((item) => {
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

        {/* Footer — user info + sign out */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/40 to-cyan-500/40 flex items-center justify-center border border-indigo-500/30 flex-shrink-0">
              <span className="text-xs font-bold text-indigo-300">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">{userName}</p>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${ROLE_COLORS[role] ?? ROLE_COLORS.VIEWER}`}>
                {role}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Se déconnecter"
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400 transition-colors flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
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
