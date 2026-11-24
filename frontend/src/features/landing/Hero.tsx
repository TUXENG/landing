import { ArrowDownRight, MessageCircle, ShieldCheck, Sparkles, Terminal, UserCheck } from "lucide-react";

import type { HeroPayload } from "../../types/api";

interface HeroProps {
  hero: HeroPayload;
  whatsappUrl: string | null;
}

const PILLAR_ICONS = [Terminal, ShieldCheck, UserCheck] as const;

export function Hero({ hero, whatsappUrl }: HeroProps) {
  const pillars = hero.trust_pillars || [];

  return (
    <section className="relative overflow-hidden border-b border-white/8 pt-16 pb-20 sm:pt-24 sm:pb-24">
      {/* Subtle architectural grid + Tux gold ambient halo */}
      <div className="tux-grid-bg pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-300/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          {hero.badge && (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-1.5 text-xs font-medium text-amber-200 shadow-inner shadow-amber-400/10">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>{hero.badge}</span>
            </div>
          )}

          <h1 className="mt-7 bg-gradient-to-b from-white via-zinc-100 to-amber-200/90 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl lg:text-6xl lg:leading-[1.08]">
            {hero.title ||
              "Soluciones Integrales en Desarrollo de Software, Electrónica y Soporte Técnico"}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            {hero.subtitle}
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
            <a
              href="#servicios"
              className="tux-cta inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold tracking-tight transition"
            >
              <span>{hero.cta_primary_text || "Explorar servicios"}</span>
              <ArrowDownRight className="h-4 w-4" />
            </a>

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-zinc-900/80 px-6 py-3.5 text-sm font-semibold text-zinc-100 backdrop-blur transition hover:border-amber-400/50 hover:bg-zinc-900 hover:text-amber-200"
              >
                <MessageCircle className="h-4 w-4 text-amber-400" />
                <span>{hero.cta_whatsapp_text || "Hablar por WhatsApp"}</span>
              </a>
            ) : (
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-zinc-900/80 px-6 py-3.5 text-sm font-semibold text-zinc-100 transition hover:border-amber-400/50"
              >
                <span>Ir a contacto</span>
              </a>
            )}
          </div>
        </div>

        {/* Pilares de confianza */}
        {pillars.length > 0 && (
          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {pillars.map((pillar, index) => {
              const Icon = PILLAR_ICONS[index % PILLAR_ICONS.length];
              return (
                <article
                  key={pillar.title}
                  className="tux-glass group rounded-2xl border border-white/10 p-6 transition hover:border-amber-400/35"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400 transition group-hover:bg-amber-400/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-bold text-white">{pillar.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{pillar.description}</p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
