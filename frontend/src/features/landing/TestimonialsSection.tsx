import { useQuery } from "@tanstack/react-query";
import { Quote, Star } from "lucide-react";

import { api } from "../../lib/api";
import type { TabSlug } from "../../types/api";

interface TestimonialsSectionProps {
  activeTab: TabSlug;
}

export function TestimonialsSection({ activeTab }: TestimonialsSectionProps) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["testimonials", activeTab],
    queryFn: () => api.getTestimonials(activeTab),
    staleTime: 60_000,
    retry: 1,
  });

  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <section id="testimonios" className="border-t border-white/8 py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="text-center">
          <span className="font-mono text-xs font-medium tracking-widest text-amber-400 uppercase">
            Prueba Social
          </span>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Lo que dicen clientes y estudiantes
          </h2>
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 animate-pulse rounded-2xl border border-white/8 bg-zinc-900/50" />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="tux-glass flex flex-col justify-between rounded-2xl border border-white/10 p-6 transition hover:border-amber-400/35"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5 text-amber-400" aria-label={`${item.rating} de 5 estrellas`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < item.rating ? "fill-amber-400 text-amber-400" : "text-zinc-700"}`}
                        />
                      ))}
                    </div>
                    <Quote className="h-4 w-4 text-amber-400/40" aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-300">“{item.comment}”</p>
                </div>

                <div className="mt-6 flex items-center gap-3 border-t border-white/8 pt-4">
                  {item.avatar_url ? (
                    <img
                      src={item.avatar_url}
                      alt={item.client_name}
                      loading="lazy"
                      className="h-10 w-10 rounded-full border border-amber-400/30 object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 font-mono text-sm font-bold text-amber-300">
                      {item.client_name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{item.client_name}</p>
                    {(item.client_role || item.company_or_institution) && (
                      <p className="truncate text-xs text-zinc-400">
                        {[item.client_role, item.company_or_institution].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
