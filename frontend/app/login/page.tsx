"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Identifiants incorrects. Veuillez réessayer.");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-[var(--text-primary)] font-[Syne]">
            DocuSmart
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--border)] p-8 shadow-2xl"
          style={{ background: "rgba(10, 10, 15, 0.85)", backdropFilter: "blur(20px)" }}>
          <h1 className="text-xl font-bold text-[var(--text-primary)] font-[Syne] mb-1">
            Connexion
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Accédez à votre espace DocuSmart
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
                Identifiant
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin / analyst / viewer"
                required
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-indigo-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-indigo-500/60 transition-colors"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          {/* Comptes démo */}
          <div className="mt-6 pt-5 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-secondary)] mb-3 text-center">Comptes de démonstration</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { user: "admin", pwd: "admin123", role: "ADMIN", color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10" },
                { user: "analyst", pwd: "analyst123", role: "ANALYST", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
                { user: "viewer", pwd: "viewer123", role: "VIEWER", color: "text-slate-400 border-slate-500/30 bg-slate-500/10" },
              ].map(({ user, pwd, role, color }) => (
                <button
                  key={user}
                  type="button"
                  onClick={() => { setUsername(user); setPassword(pwd); }}
                  className={`rounded-lg border px-2 py-2 text-center transition-colors hover:opacity-80 ${color}`}
                >
                  <p className="text-[10px] font-bold font-mono">{role}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{user}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
