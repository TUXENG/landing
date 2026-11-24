import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ExternalLink, Layers, PlayCircle, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BeforeAfterSlider } from "../../components/BeforeAfterSlider";
import { api } from "../../lib/api";
import type { PortfolioItem, TabSlug } from "../../types/api";

interface PortfolioGalleryProps {
  activeTab: TabSlug;
}

const TAB_TITLES: Record<TabSlug, { eyebrow: string; title: string; empty: string }> = {
  desarrollo: {
    eyebrow: "Portafolio de Ingeniería",
    title: "Software, plataformas y sistemas en producción",
    empty: "Pronto publicaremos capturas y casos documentados de desarrollo aquí.",
  },
  soporte: {
    eyebrow: "Evidencia Técnica Real",
    title: "Comparativas Antes y Después en soporte y electrónica",
    empty: "Pronto publicaremos comparativas reales de reparaciones y mantenimientos aquí.",
  },
  academia: {
    eyebrow: "Proyectos y Prototipos",
    title: "Simulaciones, maquetas y resultados académicos",
    empty: "Pronto publicaremos maquetas, diagramas y proyectos guiados de estudiantes aquí.",
  },
};

export function PortfolioGallery({ activeTab }: PortfolioGalleryProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    setSelectedTag(null);
  }, [activeTab]);

  useEffect(() => {
    if (!selectedItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedItem(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedItem]);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["portfolio", activeTab],
    queryFn: () => api.getPortfolio({ category: activeTab }),
    staleTime: 60_000,
    retry: 1,
  });

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      for (const tag of item.tech_tags || []) {
        if (tag.trim()) set.add(tag.trim());
      }
    }
    return Array.from(set);
  }, [items]);

  const visibleItems = useMemo(() => {
    if (!selectedTag) return items;
    return items.filter((item) => item.tech_tags?.includes(selectedTag));
  }, [items, selectedTag]);

  const copy = TAB_TITLES[activeTab];

  return (
    <section id="portafolio" className="scroll-mt-24 border-t border-white/8 py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="font-mono text-xs font-medium tracking-widest text-amber-400 uppercase">
              {copy.eyebrow}
            </span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {copy.title}
            </h2>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tecnología">
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className={`rounded-full px-3 py-1 font-mono text-xs transition ${
                  selectedTag === null
                    ? "bg-amber-400 font-semibold text-zinc-950"
                    : "border border-white/10 bg-zinc-900/70 text-zinc-300 hover:border-amber-400/40 hover:text-white"
                }`}
              >
                Todos ({items.length})
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`rounded-full px-3 py-1 font-mono text-xs transition ${
                    selectedTag === tag
                      ? "bg-amber-400 font-semibold text-zinc-950"
                      : "border border-white/10 bg-zinc-900/70 text-zinc-300 hover:border-amber-400/40 hover:text-white"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Estado cargando */}
        {isLoading && (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-80 animate-pulse rounded-2xl border border-white/8 bg-zinc-900/50"
              />
            ))}
          </div>
        )}

        {/* Estado vacío elegante */}
        {!isLoading && visibleItems.length === 0 && (
          <div className="tux-glass mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-400/10 text-amber-400">
              <Layers className="h-6 w-6" />
            </div>
            <p className="mt-4 max-w-md text-sm text-zinc-300">{copy.empty}</p>
            <a
              href="#contacto"
              className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/20"
            >
              <span>Solicitar muestra o caso similar</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* Grilla Showcase estilo Magnific */}
        {!isLoading && visibleItems.length > 0 && (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item) => (
              <article
                key={item.id}
                className="tux-glass group flex flex-col overflow-hidden rounded-2xl border border-white/10 transition hover:border-amber-400/40"
              >
                <div className="relative overflow-hidden border-b border-white/8">
                  {item.before_image_url ? (
                    <BeforeAfterSlider
                      beforeUrl={item.before_image_url}
                      afterUrl={item.image_url}
                      alt={item.title}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="block aspect-[16/10] w-full overflow-hidden bg-zinc-950 text-left"
                    >
                      <img
                        src={item.image_url}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </button>
                  )}

                  {item.is_featured && (
                    <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-black/75 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-300 backdrop-blur">
                      <Sparkles className="h-3 w-3" />
                      Destacado
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-1.5 text-zinc-300 transition hover:border-amber-400/40 hover:text-amber-300"
                      title="Ver detalle"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>

                  {item.client_label && (
                    <p className="mt-1 font-mono text-[11px] text-amber-300/80">{item.client_label}</p>
                  )}

                  <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-zinc-400">
                    {item.description}
                  </p>

                  {item.tech_tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {item.tech_tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-white/10 bg-zinc-950/80 px-2 py-0.5 font-mono text-[11px] text-zinc-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {(item.demo_url || item.video_url) && (
                    <div className="mt-4 flex items-center gap-3 border-t border-white/8 pt-3.5 text-xs">
                      {item.demo_url && (
                        <a
                          href={item.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-amber-400 hover:text-amber-300"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Ver demo</span>
                        </a>
                      )}
                      {item.video_url && (
                        <a
                          href={item.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-zinc-300 hover:text-white"
                        >
                          <PlayCircle className="h-3.5 w-3.5 text-orange-400" />
                          <span>Video</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Modal / Lightbox de detalle */}
      {selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedItem.title}
          onClick={() => setSelectedItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/15 bg-[#101219] shadow-2xl"
          >
            <div className="relative">
              {selectedItem.before_image_url ? (
                <BeforeAfterSlider
                  beforeUrl={selectedItem.before_image_url}
                  afterUrl={selectedItem.image_url}
                  alt={selectedItem.title}
                  className="aspect-[16/9]"
                />
              ) : (
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.title}
                  className="max-h-[26rem] w-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                aria-label="Cerrar detalle"
                className="absolute top-3 right-3 rounded-full border border-white/15 bg-black/75 p-2 text-zinc-200 transition hover:border-amber-400/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 font-mono text-[11px] text-amber-300 uppercase">
                  {selectedItem.category}
                </span>
                {selectedItem.client_label && (
                  <span className="font-mono text-xs text-zinc-400">{selectedItem.client_label}</span>
                )}
              </div>
              <h3 className="mt-3 text-2xl font-extrabold text-white">{selectedItem.title}</h3>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-300">
                {selectedItem.description}
              </p>

              {selectedItem.tech_tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {selectedItem.tech_tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1 font-mono text-xs text-zinc-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
                <a
                  href="#contacto"
                  onClick={() => setSelectedItem(null)}
                  className="tux-cta inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold"
                >
                  <span>Quiero un resultado similar</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                {selectedItem.demo_url && (
                  <a
                    href={selectedItem.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:border-amber-400/50"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-amber-400" />
                    <span>Abrir demo / repo</span>
                  </a>
                )}
                {selectedItem.video_url && (
                  <a
                    href={selectedItem.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:border-amber-400/50"
                  >
                    <PlayCircle className="h-3.5 w-3.5 text-orange-400" />
                    <span>Ver video</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
