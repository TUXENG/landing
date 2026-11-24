import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Plus, Search, StickyNote, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { api } from "../../lib/api";
import { buildLeadReplyWhatsAppUrl } from "../../lib/whatsapp";
import type { LeadCategory, LeadStatus } from "../../types/api";

interface LeadsInboxProps {
  token: string;
}

const STATUS_META: Record<LeadStatus, { label: string; cls: string }> = {
  nuevo: { label: "Nuevo", cls: "border-amber-400/40 bg-amber-400/15 text-amber-300" },
  contactado: { label: "Contactado", cls: "border-sky-400/40 bg-sky-400/15 text-sky-300" },
  en_proceso: { label: "En proceso", cls: "border-orange-400/40 bg-orange-400/15 text-orange-300" },
  cerrado: { label: "Cerrado", cls: "border-emerald-400/40 bg-emerald-400/15 text-emerald-300" },
  archivado: { label: "Archivado", cls: "border-zinc-600/50 bg-zinc-800/80 text-zinc-400" },
};

const ALL_STATUSES: LeadStatus[] = ["nuevo", "contactado", "en_proceso", "cerrado", "archivado"];

export function LeadsInbox({ token }: LeadsInboxProps) {
  const qc = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<LeadCategory | "">("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const summaryQuery = useQuery({
    queryKey: ["admin-leads-summary", token],
    queryFn: () => api.getLeadsSummary(token),
  });

  const leadsQuery = useQuery({
    queryKey: ["admin-leads", token, categoryFilter, statusFilter, debouncedSearch],
    queryFn: () =>
      api.getLeads(token, {
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        q: debouncedSearch || undefined,
        limit: 100,
      }),
  });

  const detailQuery = useQuery({
    queryKey: ["admin-lead-detail", token, selectedLeadId],
    queryFn: () => api.getLeadDetail(token, selectedLeadId!),
    enabled: selectedLeadId !== null,
  });

  const invalidateLeads = () => {
    qc.invalidateQueries({ queryKey: ["admin-leads"] });
    qc.invalidateQueries({ queryKey: ["admin-leads-summary"] });
    if (selectedLeadId !== null) {
      qc.invalidateQueries({ queryKey: ["admin-lead-detail", token, selectedLeadId] });
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ leadId, status }: { leadId: number; status: LeadStatus }) =>
      api.updateLead(token, leadId, { status }),
    onSuccess: invalidateLeads,
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ leadId, note }: { leadId: number; note: string }) =>
      api.addLeadNote(token, leadId, note),
    onSuccess: () => {
      setNoteText("");
      invalidateLeads();
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: ({ leadId, noteId }: { leadId: number; noteId: number }) =>
      api.deleteLeadNote(token, leadId, noteId),
    onSuccess: invalidateLeads,
  });

  const summaryRows = summaryQuery.data || [];
  const totals = summaryRows.reduce(
    (acc, row) => ({
      nuevos: acc.nuevos + row.nuevos,
      contactados: acc.contactados + row.contactados,
      en_proceso: acc.en_proceso + row.en_proceso,
      cerrados: acc.cerrados + row.cerrados,
      total: acc.total + row.total,
    }),
    { nuevos: 0, contactados: 0, en_proceso: 0, cerrados: 0, total: 0 },
  );

  function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!selectedLeadId || noteText.trim().length < 2) return;
    addNoteMutation.mutate({ leadId: selectedLeadId, note: noteText.trim() });
  }

  return (
    <div className="space-y-6">
      {/* KPIs de v_leads_summary_pivot */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total leads", value: totals.total, accent: "text-white" },
          { label: "Nuevos", value: totals.nuevos, accent: "text-amber-400" },
          { label: "Contactados", value: totals.contactados, accent: "text-sky-400" },
          { label: "En proceso", value: totals.en_proceso, accent: "text-orange-400" },
          { label: "Cerrados", value: totals.cerrados, accent: "text-emerald-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="tux-glass rounded-2xl border border-white/10 p-4">
            <p className="font-mono text-[11px] text-zinc-400 uppercase">{kpi.label}</p>
            <p className={`mt-1 text-2xl font-extrabold ${kpi.accent}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Desglose por categoría */}
      {summaryRows.length > 0 && (
        <div className="tux-glass overflow-x-auto rounded-2xl border border-white/10 p-4">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 font-mono text-[11px] text-zinc-400 uppercase">
              <tr>
                <th className="py-2 pr-4">Categoría</th>
                <th className="px-3 py-2 text-right">Nuevos</th>
                <th className="px-3 py-2 text-right">Contactados</th>
                <th className="px-3 py-2 text-right">En proceso</th>
                <th className="px-3 py-2 text-right">Cerrados</th>
                <th className="px-3 py-2 text-right">Archivados</th>
                <th className="py-2 pl-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-200">
              {summaryRows.map((row) => (
                <tr key={row.service_category}>
                  <td className="py-2 pr-4 font-semibold capitalize">{row.service_category}</td>
                  <td className="px-3 py-2 text-right text-amber-300">{row.nuevos}</td>
                  <td className="px-3 py-2 text-right text-sky-300">{row.contactados}</td>
                  <td className="px-3 py-2 text-right text-orange-300">{row.en_proceso}</td>
                  <td className="px-3 py-2 text-right text-emerald-300">{row.cerrados}</td>
                  <td className="px-3 py-2 text-right text-zinc-400">{row.archivados}</td>
                  <td className="py-2 pl-3 text-right font-bold text-white">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Filtros y búsqueda full-text */}
      <div className="tux-glass flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre, correo, tema o mensaje (sin tildes)..."
            className="w-full rounded-xl border border-white/10 bg-zinc-950/90 py-2 pr-3 pl-9 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400/70 focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as LeadCategory | "")}
          className="rounded-xl border border-white/10 bg-zinc-950/90 px-3 py-2 text-xs font-medium text-zinc-200 focus:border-amber-400/70 focus:outline-none"
        >
          <option value="">Todas las áreas</option>
          <option value="desarrollo">Desarrollo</option>
          <option value="soporte">Soporte</option>
          <option value="academia">Academia</option>
          <option value="general">General</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "")}
          className="rounded-xl border border-white/10 bg-zinc-950/90 px-3 py-2 text-xs font-medium text-zinc-200 focus:border-amber-400/70 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          {ALL_STATUSES.map((st) => (
            <option key={st} value={st}>
              {STATUS_META[st].label}
            </option>
          ))}
        </select>
      </div>

      {/* Split Master-Detail */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Lista de leads */}
        <div className="space-y-3 lg:col-span-7">
          {leadsQuery.isLoading && (
            <p className="text-sm text-zinc-400">Cargando bandeja de leads...</p>
          )}
          {!leadsQuery.isLoading && (leadsQuery.data || []).length === 0 && (
            <div className="tux-glass rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-zinc-400">
              No hay leads que coincidan con los filtros actuales.
            </div>
          )}

          {(leadsQuery.data || []).map((lead) => {
            const selected = selectedLeadId === lead.id;
            const waUrl = buildLeadReplyWhatsAppUrl(lead.phone, lead.name, lead.service_category);
            return (
              <div
                key={lead.id}
                onClick={() => setSelectedLeadId(lead.id)}
                className={`tux-glass cursor-pointer rounded-2xl border p-4 transition ${
                  selected
                    ? "border-amber-400/60 bg-amber-400/[0.06]"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{lead.name}</h3>
                      <span className="rounded-md border border-white/10 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] text-amber-300 uppercase">
                        {lead.service_category}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${STATUS_META[lead.status].cls}`}
                      >
                        {STATUS_META[lead.status].label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">
                      {lead.email} {lead.phone ? `· ${lead.phone}` : ""}
                      {lead.subcategory ? ` · ${lead.subcategory}` : ""}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-500">
                    {new Date(lead.created_at).toLocaleDateString("es-CO")}
                  </span>
                </div>

                <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-zinc-300">
                  {lead.message}
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/8 pt-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-zinc-400">
                    <StickyNote className="h-3.5 w-3.5 text-amber-400" />
                    <span>
                      {lead.notes_count} {lead.notes_count === 1 ? "nota" : "notas"}
                    </span>
                    {lead.last_note && (
                      <span className="max-w-[200px] truncate text-zinc-500">
                        · {lead.last_note}
                      </span>
                    )}
                  </span>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-400/20"
                      >
                        <MessageCircle className="h-3 w-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <select
                      value={lead.status}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          leadId: lead.id,
                          status: e.target.value as LeadStatus,
                        })
                      }
                      aria-label={`Cambiar estado de ${lead.name}`}
                      className="rounded-lg border border-white/10 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-200 focus:border-amber-400 focus:outline-none"
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {STATUS_META[st].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel de detalle y notas */}
        <div className="lg:col-span-5">
          <div className="tux-glass sticky top-24 rounded-2xl border border-white/10 p-5">
            {selectedLeadId === null ? (
              <p className="py-12 text-center text-sm text-zinc-400">
                Selecciona un lead de la lista para ver su detalle completo e historial de notas.
              </p>
            ) : detailQuery.isLoading ? (
              <p className="py-12 text-center text-sm text-zinc-400">Cargando detalle...</p>
            ) : detailQuery.data ? (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-white">{detailQuery.data.name}</h3>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold ${STATUS_META[detailQuery.data.status].cls}`}
                    >
                      {STATUS_META[detailQuery.data.status].label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{detailQuery.data.email}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-white/8 bg-zinc-950/70 p-3 text-xs">
                    <div>
                      <span className="text-zinc-500">Teléfono:</span>{" "}
                      <span className="text-zinc-200">{detailQuery.data.phone || "—"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Modalidad:</span>{" "}
                      <span className="text-zinc-200">{detailQuery.data.modality || "—"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Subcategoría:</span>{" "}
                      <span className="text-zinc-200">{detailQuery.data.subcategory || "—"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Presupuesto:</span>{" "}
                      <span className="text-zinc-200">{detailQuery.data.estimated_budget || "—"}</span>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-line rounded-xl border border-white/8 bg-zinc-950/60 p-3.5 text-xs leading-relaxed text-zinc-200">
                    {detailQuery.data.message}
                  </p>
                </div>

                {/* Historial de notas */}
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-xs font-bold tracking-wider text-amber-400 uppercase">
                    Notas de seguimiento ({detailQuery.data.notes.length})
                  </h4>

                  <form onSubmit={handleAddNote} className="mt-3 flex gap-2">
                    <input
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Registrar llamada, cotización o acuerdo..."
                      className="flex-1 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-amber-400/70 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={addNoteMutation.isPending || noteText.trim().length < 2}
                      className="tux-cta inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-bold disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Agregar</span>
                    </button>
                  </form>

                  <div className="mt-4 max-h-64 space-y-2.5 overflow-y-auto pr-1">
                    {detailQuery.data.notes.length === 0 && (
                      <p className="text-xs text-zinc-500">Sin notas todavía.</p>
                    )}
                    {detailQuery.data.notes.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start justify-between gap-2 rounded-xl border border-white/8 bg-zinc-950/80 p-3 text-xs"
                      >
                        <div>
                          <p className="whitespace-pre-line text-zinc-200">{n.note}</p>
                          <p className="mt-1 font-mono text-[10px] text-zinc-500">
                            {new Date(n.created_at).toLocaleString("es-CO")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            deleteNoteMutation.mutate({
                              leadId: detailQuery.data!.id,
                              noteId: n.id,
                            })
                          }
                          aria-label="Eliminar nota"
                          className="rounded-lg p-1 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
