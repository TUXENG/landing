import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Eye, EyeOff, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";

import { BeforeAfterSlider } from "../../components/BeforeAfterSlider";
import { api } from "../../lib/api";
import type { PortfolioCategory, PortfolioItem, PortfolioItemCreate } from "../../types/api";

interface PortfolioManagerProps {
  token: string;
}

interface FormState {
  category: PortfolioCategory;
  title: string;
  slug: string;
  client_label: string;
  description: string;
  tech_tags_csv: string;
  image_url: string;
  before_image_url: string;
  demo_url: string;
  video_url: string;
  is_featured: boolean;
  sort_order: number;
  is_published: boolean;
}

const EMPTY_FORM: FormState = {
  category: "desarrollo",
  title: "",
  slug: "",
  client_label: "",
  description: "",
  tech_tags_csv: "",
  image_url: "",
  before_image_url: "",
  demo_url: "",
  video_url: "",
  is_featured: false,
  sort_order: 0,
  is_published: true,
};

const ALLOWED_TYPES = ["image/webp", "image/png", "image/jpeg"];
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function PortfolioManager({ token }: PortfolioManagerProps) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadingField, setUploadingField] = useState<"image_url" | "before_image_url" | null>(null);

  const listQuery = useQuery({
    queryKey: ["admin-portfolio", token],
    queryFn: () => api.getAdminPortfolio(token),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-portfolio"] });
    qc.invalidateQueries({ queryKey: ["portfolio"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const tags = form.tech_tags_csv
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: PortfolioItemCreate = {
        category: form.category,
        title: form.title.trim(),
        slug: form.slug.trim() || null,
        client_label: form.client_label.trim() || null,
        description: form.description.trim(),
        tech_tags: tags,
        image_url: form.image_url.trim(),
        before_image_url: form.before_image_url.trim() || null,
        demo_url: form.demo_url.trim() || null,
        video_url: form.video_url.trim() || null,
        is_featured: form.is_featured,
        sort_order: Number(form.sort_order) || 0,
        is_published: form.is_published,
      };

      if (editingId !== null) {
        return api.updatePortfolio(token, editingId, payload);
      }
      return api.createPortfolio(token, payload);
    },
    onSuccess: () => {
      setErrorMsg("");
      setFormOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      invalidate();
    },
    onError: (err) => {
      setErrorMsg(err instanceof Error ? err.message : "Error al guardar evidencia");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deletePortfolio(token, id),
    onSuccess: invalidate,
  });

  const togglePublishMutation = useMutation({
    mutationFn: (item: PortfolioItem) =>
      api.updatePortfolio(token, item.id, { is_published: !item.is_published }),
    onSuccess: invalidate,
  });

  async function handleImageUpload(
    e: ChangeEvent<HTMLInputElement>,
    field: "image_url" | "before_image_url",
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg("Formato inválido. Usa WebP, PNG o JPEG.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setErrorMsg("La imagen supera el máximo de 5 MB.");
      return;
    }

    setErrorMsg("");
    setUploadingField(field);
    try {
      const uploaded = await api.uploadImage(token, file);
      setForm((prev) => ({ ...prev, [field]: uploaded.url }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setUploadingField(null);
    }
  }

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrorMsg("");
    setFormOpen(true);
  }

  function openEdit(item: PortfolioItem) {
    setEditingId(item.id);
    setForm({
      category: item.category,
      title: item.title,
      slug: item.slug || "",
      client_label: item.client_label || "",
      description: item.description,
      tech_tags_csv: item.tech_tags.join(", "),
      image_url: item.image_url,
      before_image_url: item.before_image_url || "",
      demo_url: item.demo_url || "",
      video_url: item.video_url || "",
      is_featured: item.is_featured,
      sort_order: item.sort_order,
      is_published: item.is_published,
    });
    setErrorMsg("");
    setFormOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    saveMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Portafolio y Evidencias</h2>
          <p className="text-xs text-zinc-400">
            Sube capturas o fotos Antes/Después directo a <code className="text-amber-300">/uploads</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="tux-cta inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva evidencia</span>
        </button>
      </div>

      {/* Formulario crear/editar */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="tux-glass space-y-4 rounded-3xl border border-amber-400/30 p-6"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              {editingId ? `Editar evidencia #${editingId}` : "Nueva evidencia de portafolio"}
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
                onChange={(e) => setForm({ ...form, category: e.target.value as PortfolioCategory })}
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
              >
                <option value="desarrollo">Desarrollo</option>
                <option value="soporte">Soporte</option>
                <option value="academia">Academia</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-zinc-300">Título *</label>
              <input
                required
                minLength={3}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ej. Sistema de Gestión de Inventario Web"
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Slug opcional (a-z, 0-9, -)
              </label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                placeholder="sistema-inventario-web"
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 font-mono text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">Cliente / Etiqueta</label>
              <input
                value={form.client_label}
                onChange={(e) => setForm({ ...form, client_label: e.target.value })}
                placeholder="Pyme sector salud"
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Tecnologías (separadas por coma)
              </label>
              <input
                value={form.tech_tags_csv}
                onChange={(e) => setForm({ ...form, tech_tags_csv: e.target.value })}
                placeholder="React, FastAPI, ESP32"
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">Descripción *</label>
            <textarea
              required
              minLength={10}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Reto resuelto, arquitectura aplicada y resultado..."
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
          </div>

          {/* Subida de imágenes */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Imagen principal / Después *
              </label>
              <div className="flex gap-2">
                <input
                  required
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="/uploads/..."
                  className="flex-1 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 font-mono text-xs text-white"
                />
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-400/35 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/20">
                  <Upload className="h-3.5 w-3.5" />
                  <span>{uploadingField === "image_url" ? "Subiendo..." : "Subir"}</span>
                  <input
                    type="file"
                    accept="image/webp,image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "image_url")}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Imagen “Antes” (opcional, activa slider)
              </label>
              <div className="flex gap-2">
                <input
                  value={form.before_image_url}
                  onChange={(e) => setForm({ ...form, before_image_url: e.target.value })}
                  placeholder="/uploads/antes.webp"
                  className="flex-1 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 font-mono text-xs text-white"
                />
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-amber-400/40">
                  <Upload className="h-3.5 w-3.5 text-amber-400" />
                  <span>{uploadingField === "before_image_url" ? "Subiendo..." : "Subir"}</span>
                  <input
                    type="file"
                    accept="image/webp,image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "before_image_url")}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Vista previa instantánea */}
          {form.image_url && (
            <div className="max-w-md overflow-hidden rounded-2xl border border-white/10">
              {form.before_image_url ? (
                <BeforeAfterSlider
                  beforeUrl={form.before_image_url}
                  afterUrl={form.image_url}
                  alt={form.title || "Vista previa"}
                />
              ) : (
                <img src={form.image_url} alt="Vista previa" className="aspect-[16/10] w-full object-cover" />
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">Demo / GitHub URL</label>
              <input
                value={form.demo_url}
                onChange={(e) => setForm({ ...form, demo_url: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">Video URL</label>
              <input
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                placeholder="https://youtube.com/..."
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">Orden (sort_order)</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-200">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                className="accent-amber-400"
              />
              <span>Publicado en la landing</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                className="accent-amber-400"
              />
              <span>Destacado (aparece primero)</span>
            </label>
          </div>

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
              {saveMutation.isPending ? "Guardando..." : "Guardar evidencia"}
            </button>
          </div>
        </form>
      )}

      {/* Listado */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(listQuery.data || []).map((item) => (
          <div
            key={item.id}
            className="tux-glass flex flex-col overflow-hidden rounded-2xl border border-white/10"
          >
            <div className="relative aspect-[16/10] bg-zinc-950">
              <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
              <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                <span className="rounded-full bg-black/75 px-2 py-0.5 font-mono text-[10px] text-amber-300 uppercase">
                  {item.category}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                    item.is_published
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-zinc-800/90 text-zinc-400"
                  }`}
                >
                  {item.is_published ? "Publicado" : "Borrador"}
                </span>
              </div>
              {item.is_featured && (
                <Sparkles className="absolute top-2.5 right-2.5 h-4 w-4 text-amber-400" />
              )}
            </div>

            <div className="flex flex-1 flex-col p-4">
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{item.description}</p>
              <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-white/8 pt-3">
                <button
                  type="button"
                  onClick={() => togglePublishMutation.mutate(item)}
                  title={item.is_published ? "Pasar a borrador" : "Publicar"}
                  className="rounded-lg border border-white/10 p-1.5 text-zinc-300 hover:border-amber-400/40 hover:text-amber-300"
                >
                  {item.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  title="Editar"
                  className="rounded-lg border border-white/10 p-1.5 text-zinc-300 hover:border-amber-400/40 hover:text-amber-300"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`¿Eliminar "${item.title}"?`)) {
                      deleteMutation.mutate(item.id);
                    }
                  }}
                  title="Eliminar"
                  className="rounded-lg border border-white/10 p-1.5 text-zinc-400 hover:border-rose-500/40 hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!listQuery.isLoading && (listQuery.data || []).length === 0 && !formOpen && (
        <div className="tux-glass rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-zinc-400">
          Aún no hay evidencias registradas. Crea la primera para mostrarla en la landing.
        </div>
      )}
    </div>
  );
}
