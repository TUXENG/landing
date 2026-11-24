import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Save } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { api } from "../../lib/api";
import type { ContentSlug } from "../../types/api";
import { DEFAULT_CONTENT } from "../landing/defaultContent";

interface ContentEditorProps {
  token: string;
}

const SECTIONS: { slug: ContentSlug; label: string }[] = [
  { slug: "hero", label: "Hero Principal" },
  { slug: "tab_desarrollo", label: "Pestaña Desarrollo" },
  { slug: "tab_soporte", label: "Pestaña Soporte" },
  { slug: "tab_academia", label: "Pestaña Academia" },
  { slug: "faq", label: "Preguntas Frecuentes (FAQ)" },
  { slug: "contact_channels", label: "Canales y Redes" },
];

export function ContentEditor({ token }: ContentEditorProps) {
  const qc = useQueryClient();
  const [activeSlug, setActiveSlug] = useState<ContentSlug>("hero");
  const [title, setTitle] = useState("");
  const [payloadText, setPayloadText] = useState("{}");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const contentQuery = useQuery({
    queryKey: ["content"],
    queryFn: api.getContent,
    initialData: DEFAULT_CONTENT,
  });

  useEffect(() => {
    const section = contentQuery.data?.[activeSlug] || DEFAULT_CONTENT[activeSlug];
    if (!section) return;
    setTitle(section.title);
    setPayloadText(JSON.stringify(section.payload, null, 2));
    setFeedback(null);
  }, [activeSlug, contentQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(payloadText) as Record<string, unknown>;
      } catch {
        throw new Error("El JSON del payload tiene un error de sintaxis.");
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("El payload debe ser un objeto JSON válido.");
      }
      return api.updateContent(token, activeSlug, title.trim(), parsed);
    },
    onSuccess: () => {
      setFeedback({
        type: "ok",
        text: `Sección "${activeSlug}" guardada y caché Redis invalidada.`,
      });
      qc.invalidateQueries({ queryKey: ["content"] });
    },
    onError: (err) => {
      setFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "Error al guardar sección",
      });
    },
  });

  function updateJsonField(field: string, value: string) {
    try {
      const parsed = JSON.parse(payloadText) as Record<string, unknown>;
      parsed[field] = value;
      setPayloadText(JSON.stringify(parsed, null, 2));
    } catch {
      // Si el JSON manual tiene error temporal, no sobrescribir
    }
  }

  let parsedPreview: Record<string, unknown> = {};
  try {
    parsedPreview = JSON.parse(payloadText) as Record<string, unknown>;
  } catch {
    parsedPreview = {};
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    saveMutation.mutate();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Selector de secciones */}
      <aside className="space-y-2 lg:col-span-3">
        {SECTIONS.map((sec) => {
          const active = activeSlug === sec.slug;
          return (
            <button
              key={sec.slug}
              type="button"
              onClick={() => setActiveSlug(sec.slug)}
              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs font-semibold transition ${
                active
                  ? "border-amber-400/50 bg-amber-400/15 text-amber-300"
                  : "border-white/10 bg-zinc-900/60 text-zinc-300 hover:border-white/25 hover:text-white"
              }`}
            >
              <span>{sec.label}</span>
              <span className="font-mono text-[10px] opacity-60">{sec.slug}</span>
            </button>
          );
        })}
      </aside>

      {/* Formulario editor */}
      <form
        onSubmit={handleSubmit}
        className="tux-glass space-y-5 rounded-3xl border border-white/10 p-6 lg:col-span-9"
      >
        <div>
          <span className="font-mono text-[11px] text-amber-400 uppercase">PUT /api/v1/content/{activeSlug}</span>
          <h2 className="mt-1 text-lg font-bold text-white">Editar sección</h2>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Título de la sección</label>
          <input
            required
            minLength={2}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-400/70 focus:outline-none"
          />
        </div>

        {/* Atajos guiados para Hero */}
        {activeSlug === "hero" && (
          <div className="grid gap-3 rounded-2xl border border-white/8 bg-zinc-950/60 p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">Badge superior</label>
              <input
                value={String(parsedPreview.badge || "")}
                onChange={(e) => updateJsonField("badge", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">Titular principal (H1)</label>
              <input
                value={String(parsedPreview.title || "")}
                onChange={(e) => updateJsonField("title", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">Subtítulo</label>
              <textarea
                rows={2}
                value={String(parsedPreview.subtitle || "")}
                onChange={(e) => updateJsonField("subtitle", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* Atajos guiados para Canales de Contacto */}
        {activeSlug === "contact_channels" && (
          <div className="grid gap-3 rounded-2xl border border-white/8 bg-zinc-950/60 p-4 sm:grid-cols-2">
            {[
              { key: "whatsapp", label: "WhatsApp (ej. 573001234567)" },
              { key: "email", label: "Correo público" },
              { key: "github", label: "GitHub URL" },
              { key: "linkedin", label: "LinkedIn URL" },
              { key: "youtube", label: "YouTube URL" },
              { key: "instagram", label: "Instagram URL" },
              { key: "tiktok", label: "TikTok URL" },
            ].map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-xs text-zinc-400">{field.label}</label>
                <input
                  value={String(parsedPreview[field.key] || "")}
                  onChange={(e) => updateJsonField(field.key, e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white"
                />
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
            Payload JSON completo (servicios, cursos, FAQ y configuraciones)
          </label>
          <textarea
            rows={14}
            spellCheck={false}
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-950 p-3.5 font-mono text-xs leading-relaxed text-amber-100 focus:border-amber-400/70 focus:outline-none"
          />
        </div>

        {feedback && (
          <p
            className={`flex items-center gap-2 rounded-xl border p-3 text-xs ${
              feedback.type === "ok"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/40 bg-rose-500/10 text-rose-300"
            }`}
          >
            {feedback.type === "ok" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <span>{feedback.text}</span>
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="tux-cta inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saveMutation.isPending ? "Guardando..." : "Guardar e invalidar caché"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
