import { Lock } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { BrandBadge } from "../../components/BrandBadge";
import { api } from "../../lib/api";

interface AdminLoginProps {
  onSuccess: (token: string) => void;
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await api.login(email.trim(), password);
      onSuccess(res.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de inicio de sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#08090D] px-5 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandBadge />
          <h1 className="mt-6 text-2xl font-extrabold text-white">Panel Administrador</h1>
          <p className="mt-1.5 text-xs text-zinc-400">
            Gestiona leads, evidencias de portafolio, testimonios y textos en vivo.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="tux-glass space-y-4 rounded-3xl border border-white/10 p-6 sm:p-7"
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
              Correo administrador
            </label>
            <input
              type="text"
              inputMode="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tuxserver.local"
              className="w-full rounded-xl border border-white/10 bg-zinc-950/90 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400/70 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Contraseña</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-zinc-950/90 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400/70 focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="tux-cta inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold transition disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            <span>{submitting ? "Verificando..." : "Ingresar al panel"}</span>
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          <Link to="/" className="hover:text-amber-400">
            ← Volver a la landing pública
          </Link>
        </p>
      </div>
    </div>
  );
}
