import { Layers } from "lucide-react";

export interface ServiceItem {
  title: string;
  description: string;
}

export function Services({ title, items }: { title: string; items: ServiceItem[] }) {
  return (
    <section id="servicios" className="border-t border-slate-800/80 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-white">{title}</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-indigo-500/50"
            >
              <div className="mb-4 inline-flex rounded-lg bg-indigo-500/15 p-2.5 text-indigo-400">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
