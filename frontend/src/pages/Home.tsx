import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { DEFAULT_CONTENT } from "../features/landing/defaultContent";
import { Faq, type FaqItem } from "../features/landing/Faq";
import { Hero } from "../features/landing/Hero";
import { Services, type ServiceItem } from "../features/landing/Services";
import { ContactForm } from "../features/leads/ContactForm";
import { api } from "../lib/api";

export function Home() {
  const { data } = useQuery({
    queryKey: ["content"],
    queryFn: api.getContent,
    initialData: DEFAULT_CONTENT,
    staleTime: 60_000,
    retry: 1,
  });

  const hero = (data.hero?.payload || DEFAULT_CONTENT.hero.payload) as Record<string, string>;
  const services = ((data.services?.payload?.items as ServiceItem[]) ||
    (DEFAULT_CONTENT.services.payload.items as ServiceItem[]));
  const faq = ((data.faq?.payload?.items as FaqItem[]) || (DEFAULT_CONTENT.faq.payload.items as FaqItem[]));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight text-white">TuxEng</span>
          <nav className="flex items-center gap-6 text-sm text-slate-300">
            <a href="#servicios" className="hover:text-white">
              Servicios
            </a>
            <a href="#faq" className="hover:text-white">
              FAQ
            </a>
            <a href="#contacto" className="rounded-lg bg-indigo-500/20 px-3 py-1.5 font-medium text-indigo-300 hover:bg-indigo-500/30">
              Contacto
            </a>
          </nav>
        </div>
      </header>

      <main>
        <Hero
          badge={hero.badge || ""}
          headline={hero.headline || ""}
          subheadline={hero.subheadline || ""}
          ctaPrimary={hero.cta_primary || "Contactar"}
          ctaSecondary={hero.cta_secondary || "Servicios"}
        />
        <Services title={data.services?.title || "Servicios"} items={services} />
        <Faq title={data.faq?.title || "Preguntas Frecuentes"} items={faq} />
        <ContactForm />
      </main>

      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>
          © {new Date().getFullYear()} TuxEng ·{" "}
          <Link to="/admin" className="underline hover:text-slate-300">
            Admin
          </Link>
        </p>
      </footer>
    </div>
  );
}
