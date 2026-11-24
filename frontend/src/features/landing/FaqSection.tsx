import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import type { FaqItem, TabSlug } from "../../types/api";

interface FaqSectionProps {
  title: string;
  items: FaqItem[];
  activeTab: TabSlug;
}

const TAB_LABEL: Record<TabSlug, string> = {
  desarrollo: "Desarrollo",
  soporte: "Soporte",
  academia: "Academia",
};

export function FaqSection({ title, items, activeTab }: FaqSectionProps) {
  const [showAll, setShowAll] = useState(false);

  const filteredItems = useMemo(() => {
    if (showAll) return items;
    const contextual = items.filter((item) => item.category === "general" || item.category === activeTab);
    return contextual.length > 0 ? contextual : items;
  }, [items, activeTab, showAll]);

  return (
    <section id="faq" className="scroll-mt-24 border-t border-white/8 py-20">
      <div className="mx-auto max-w-3xl px-5 sm:px-6">
        <div className="text-center">
          <span className="font-mono text-xs font-medium tracking-widest text-amber-400 uppercase">
            Resuelve tus dudas
          </span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{title}</h2>

          <div className="mt-5 inline-flex rounded-full border border-white/10 bg-zinc-900/70 p-1 text-xs">
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className={`rounded-full px-3.5 py-1.5 font-semibold transition ${
                !showAll ? "bg-amber-400 text-zinc-950" : "text-zinc-400 hover:text-white"
              }`}
            >
              {TAB_LABEL[activeTab]} + General
            </button>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className={`rounded-full px-3.5 py-1.5 font-semibold transition ${
                showAll ? "bg-amber-400 text-zinc-950" : "text-zinc-400 hover:text-white"
              }`}
            >
              Todas ({items.length})
            </button>
          </div>
        </div>

        <div className="mt-9 space-y-3">
          {filteredItems.map((item) => (
            <details
              key={`${item.category}-${item.question}`}
              className="tux-glass group rounded-2xl border border-white/10 transition open:border-amber-400/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left text-sm font-semibold text-white sm:text-base">
                <span className="flex items-center gap-2.5">
                  <span className="rounded-md border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] text-amber-300 uppercase">
                    {item.category}
                  </span>
                  <span>{item.question}</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400 transition group-open:rotate-180 group-open:text-amber-400" />
              </summary>
              <p className="border-t border-white/8 px-5 pt-3.5 pb-5 text-sm leading-relaxed text-zinc-400">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
