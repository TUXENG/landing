import { Code2, GraduationCap, Wrench } from "lucide-react";

import type { TabSlug } from "../../types/api";

interface ServiceTabsProps {
  activeTab: TabSlug;
  onSelectTab: (tab: TabSlug) => void;
}

const TABS: {
  slug: TabSlug;
  title: string;
  subtitle: string;
  icon: typeof Code2;
}[] = [
  {
    slug: "desarrollo",
    title: "Desarrollo y Proyectos",
    subtitle: "Web Apps · Kotlin · Embebidos",
    icon: Code2,
  },
  {
    slug: "soporte",
    title: "Soporte y Reparación",
    subtitle: "PCs · Electrónica · Diagnóstico",
    icon: Wrench,
  },
  {
    slug: "academia",
    title: "Clases y Academia",
    subtitle: "Tutorías · Proyectos de Grado",
    icon: GraduationCap,
  },
];

export function ServiceTabs({ activeTab, onSelectTab }: ServiceTabsProps) {
  return (
    <div id="servicios" className="scroll-mt-24 pt-16 sm:pt-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="text-center">
          <span className="font-mono text-xs font-medium tracking-widest text-amber-400 uppercase">
            Especialidades TuxEng
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Elige el área que necesitas resolver
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400 sm:text-base">
            Cada pestaña muestra el catálogo, evidencias comprobables y formulario adaptado a tu perfil.
          </p>
        </div>

        {/* Segmented pill bar */}
        <div
          role="tablist"
          aria-label="Áreas de servicio"
          className="tux-glass mx-auto mt-9 grid max-w-4xl gap-2 rounded-2xl border border-white/10 p-2 sm:grid-cols-3"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.slug;
            return (
              <button
                key={tab.slug}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectTab(tab.slug)}
                className={`group flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-left transition ${
                  isActive
                    ? "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-zinc-950 shadow-lg shadow-amber-500/25"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                    isActive
                      ? "bg-zinc-950/15 text-zinc-950"
                      : "border border-white/10 bg-zinc-950/70 text-amber-400 group-hover:border-amber-400/40"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{tab.title}</span>
                  <span
                    className={`mt-0.5 block truncate font-mono text-[11px] ${
                      isActive ? "text-zinc-900/80" : "text-zinc-400"
                    }`}
                  >
                    {tab.subtitle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
