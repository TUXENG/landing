import { ArrowRight, Sparkles } from "lucide-react";

interface HeroProps {
  badge: string;
  headline: string;
  subheadline: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export function Hero({ badge, headline, subheadline, ctaPrimary, ctaSecondary }: HeroProps) {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" />
          {badge}
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">{headline}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">{subheadline}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
          >
            {ctaPrimary}
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#servicios"
            className="rounded-xl border border-slate-700 bg-slate-900/70 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            {ctaSecondary}
          </a>
        </div>
      </div>
    </section>
  );
}
