import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

import { api } from "../../lib/api";

export function AdminPanel() {
  const qc = useQueryClient();
  const [token, setToken] = useState<string>(() => sessionStorage.getItem("admin_token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");

  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  const leadsQuery = useQuery({
    queryKey: ["admin-leads", token],
    queryFn: () => api.getLeads(token),
    enabled: Boolean(token),
  });

  const contentQuery = useQuery({
    queryKey: ["content"],
    queryFn: api.getContent,
    enabled: Boolean(token),
  });

  const saveHero = useMutation({
    mutationFn: () => {
      const current = contentQuery.data?.hero?.payload || {};
      return api.updateContent(token, "hero", "Hero Principal", {
        ...current,
        headline: headline || current.headline,
        subheadline: subheadline || current.subheadline,
      });
    },
    onSuccess: () => {
      setSaveMsg("Contenido actualizado y caché Redis invalidada.");
      qc.invalidateQueries({ queryKey: ["content"] });
    },
  });

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginErr("");
    try {
      const res = await api.login(email, password);
      sessionStorage.setItem("admin_token", res.access_token);
      setToken(res.access_token);
    } catch (err) {
      setLoginErr(err instanceof Error ? err.message : "Error de inicio de sesión");
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-6 py-24">
        <h1 className="text-2xl font-bold text-white">Panel Administrador</h1>
        <form onSubmit={handleLogin} className="mt-6 space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo administrador"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
          />
          {loginErr && <p className="text-xs text-rose-400">{loginErr}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            Ingresar
          </button>
        </form>
      </div>
    );
  }

  const currentHero = contentQuery.data?.hero?.payload || {};

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Panel Administrador</h1>
        <button
          onClick={() => {
            sessionStorage.removeItem("admin_token");
            setToken("");
          }}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Editar Hero Principal</h2>
        <input
          defaultValue={String(currentHero.headline || "")}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Titular principal"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
        />
        <textarea
          rows={3}
          defaultValue={String(currentHero.subheadline || "")}
          onChange={(e) => setSubheadline(e.target.value)}
          placeholder="Subtítulo"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
        />
        {saveMsg && <p className="text-xs text-emerald-400">{saveMsg}</p>}
        <button
          onClick={() => saveHero.mutate()}
          disabled={saveHero.isPending}
          className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
        >
          Guardar cambios
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Leads recibidos ({leadsQuery.data?.length || 0})</h2>
        <div className="mt-4 space-y-3">
          {(leadsQuery.data || []).map((lead) => (
            <div key={lead.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2 font-medium text-white">
                <span>
                  {lead.name} &lt;{lead.email}&gt; {lead.phone ? `· ${lead.phone}` : ""}
                </span>
                <span className="text-xs text-slate-400">{new Date(lead.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-slate-300">{lead.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
