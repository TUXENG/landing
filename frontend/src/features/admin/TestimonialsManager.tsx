import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Eye, EyeOff, Plus, Star, Trash2, X } from "lucide-react";
import { type FormEvent, useState } from "react";

import { api } from "../../lib/api";
import type { LeadCategory, Testimonial, TestimonialCreate } from "../../types/api";

interface TestimonialsManagerProps {
  token: string;
}

interface FormState {
  category: LeadCategory;
  client_name: string;
  client_role: string;
  company_or_institution: string;
  comment: string;
  rating: number;
  sort_order: number;
  is_published: boolean;
}

const EMPTY_FORM: FormState = {
  category: "desarrollo",
  client_name: "",
  client_role: "",
  company_or_institution: "",
  comment: "",
  rating: 5,
  sort_order: 0,
  is_published: true,
};

export function TestimonialsManager({ token }: TestimonialsManagerProps) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errorMsg, setErrorMsg] = useState("");

  const listQuery = useQuery({
    queryKey: ["admin-testimonials", token],
    queryFn: () => api.getAdminTestimonials(token),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    qc.invalidateQueries({ queryKey: ["testimonials"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: TestimonialCreate = {
        category: form.category,
        client_name: form.client_name.trim(),
        client_role: form.client_role.trim() || null,
        company_or_institution: form.company_or_institution.trim() || null,
        comment: form.comment.trim(),
        rating: form.rating,
        sort_order: Number(form.sort_order) || 0,
        is_published: form.is_published,
      };
      if (editingId !== null) {
        return api.updateTestimonial(token, editingId, payload);
      }
      return api.createTestimonial(token, payload);
    },
    onSuccess: () => {
      setFormOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setErrorMsg("");
      invalidate();
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : "Error al guardar reseña"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteTestimonial(token, id),
    onSuccess: invalidate,
  });

  const toggleMutation = useMutation({
    mutationFn: (item: Testimonial) =>
      api.updateTestimonial(token, item.id, { is_published: !item.is_published }),
    onSuccess: invalidate,
  });

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrorMsg("");
    setFormOpen(true);
  }

  function openEdit(item: Testimonial) {
    setEditingId(item.id);
    setForm({
      category: item.category,
      client_name: item.client_name,
      client_role: item.client_role || "",
      company_or_institution: item.company_or_institution || "",
      comment: item.comment,
      rating: item.rating,
      sort_order: item.sort_order,
      is_published: item.is_published,
    });
    setErrorMsg("");
    setFormOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Testimonios y Reseñas</h2>
          <p className="text-xs text-zinc-400">
            Administra recomendaciones por área (solo las publicadas son visibles al público).
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="tux-cta inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo testimonio</span>
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="tux-glass space-y-4 rounded-3xl border border-amber-400/30 p-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              {editingId ? `Editar testimonio #${editingId}` : "Nuevo testimonio"}
            </h3>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">Categoría *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as LeadCategory })}
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
              >
                <option value="desarrollo">Desarrollo</option>
                <option value="soporte">Soporte</option>
                <option value="academia">Academia</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">Nombre *</label>
              <input
                required
                minLength={2}
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                placeholder="Ej. María Fernanda López"
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">Calificación (1-5)</label>
              <div className="flex items-center gap-1 pt-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm({ ...form, rating: n })}
                    aria-label={`${n} estrellas`}
                    className="p-0.5"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        n <= form.rating ? "fill-amber-400 text-amber-400" : "text-zinc-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">Rol / Cargo</label>
              <input
                value={form.client_role}
                onChange={(e) => setForm({ ...form, client_role: e.target.value })}
                placeholder="Estudiante Ing. Electrónica"
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Empresa / Institución
              </label>
              <input
                value={form.company_or_institution}
                onChange={(e) => setForm({ ...form, company_or_institution: e.target.value })}
                placeholder="Universidad / Pyme"
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">Orden</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">Comentario *</label>
            <textarea
              required
              minLength={10}
              rows={3}
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Comentario real del cliente o estudiante..."
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-zinc-200">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              className="accent-amber-400"
            />
            <span>Publicado en la landing</span>
          </label>

          {errorMsg && (
            <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
              {errorMsg}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="tux-cta rounded-full px-5 py-2 text-xs font-bold disabled:opacity-50"
            >
              {saveMutation.isPending ? "Guardando..." : "Guardar testimonio"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {(listQuery.data || []).map((item) => (
          <div key={item.id} className="tux-glass rounded-2xl border border-white/10 p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-400/15 px-2 py-0.5 font-mono text-[10px] text-amber-300 uppercase">
                    {item.category}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                      item.is_published
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {item.is_published ? "Publicado" : "Borrador"}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-white">{item.client_name}</h3>
                {(item.client_role || item.company_or_institution) && (
                  <p className="text-xs text-zinc-400">
                    {[item.client_role, item.company_or_institution].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-zinc-300">“{item.comment}”</p>

            <div className="mt-4 flex justify-end gap-1.5 border-t border-white/8 pt-3">
              <button
                type="button"
                onClick={() => toggleMutation.mutate(item)}
                className="rounded-lg border border-white/10 p-1.5 text-zinc-300 hover:border-amber-400/40 hover:text-amber-300"
              >
                {item.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => openEdit(item)}
                className="rounded-lg border border-white/10 p-1.5 text-zinc-300 hover:border-amber-400/40 hover:text-amber-300"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`¿Eliminar reseña de "${item.client_name}"?`)) {
                    deleteMutation.mutate(item.id);
                  }
                }}
                className="rounded-lg border border-white/10 p-1.5 text-zinc-400 hover:border-rose-500/40 hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!listQuery.isLoading && (listQuery.data || []).length === 0 && !formOpen && (
        <div className="tux-glass rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-zinc-400">
          Sin testimonios cargados todavía.
        </div>
      )}
    </div>
  );
}
