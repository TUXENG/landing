export interface FaqItem {
  q: string;
  a: string;
}

export function Faq({ title, items }: { title: string; items: FaqItem[] }) {
  return (
    <section id="faq" className="border-t border-slate-800/80 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-white">{title}</h2>
        <div className="mt-10 space-y-4">
          {items.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-slate-800 bg-slate-900/50 p-5 open:border-indigo-500/40"
            >
              <summary className="cursor-pointer list-none font-medium text-white">{item.q}</summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
