import { Menu, X } from "lucide-react";
import { useState } from "react";

import { BrandBadge } from "../../components/BrandBadge";
import { SocialLinks } from "../../components/SocialLinks";
import type { ContactChannelsPayload, TabSlug } from "../../types/api";

interface NavbarProps {
  activeTab: TabSlug;
  onSelectTab: (tab: TabSlug, scroll?: boolean) => void;
  channels?: ContactChannelsPayload;
}

const TAB_LINKS: { slug: TabSlug; label: string }[] = [
  { slug: "desarrollo", label: "Desarrollo" },
  { slug: "soporte", label: "Soporte" },
  { slug: "academia", label: "Academia" },
];

export function Navbar({ activeTab, onSelectTab, channels }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#08090D]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-6">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl"
        >
          <BrandBadge />
        </a>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
          <div className="mr-3 flex items-center rounded-full border border-white/10 bg-zinc-900/70 p-1">
            {TAB_LINKS.map((item) => {
              const isActive = activeTab === item.slug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => onSelectTab(item.slug, true)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-amber-400 text-zinc-950 shadow-sm shadow-amber-400/30"
                      : "text-zinc-300 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <a
            href="#portafolio"
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:text-white"
          >
            Evidencias
          </a>
          <a href="#faq" className="rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:text-white">
            FAQ
          </a>
          <div className="mx-1 hidden border-l border-white/10 pl-2 lg:block">
            <SocialLinks channels={channels} activeTab={activeTab} variant="compact" includeWhatsApp={false} />
          </div>
          <a
            href="#contacto"
            className="tux-cta ml-2 rounded-full px-4 py-2 text-xs font-bold tracking-wide transition"
          >
            Cotizar / Contactar
          </a>
        </nav>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Abrir menú"
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 p-2 text-zinc-200 md:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-[#0B0D13]/95 px-5 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-2">
            {TAB_LINKS.map((item) => {
              const isActive = activeTab === item.slug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.slug, true);
                    setMenuOpen(false);
                  }}
                  className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-semibold ${
                    isActive
                      ? "border border-amber-400/40 bg-amber-400/15 text-amber-300"
                      : "border border-white/5 bg-zinc-900/60 text-zinc-300"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="font-mono text-[11px] opacity-70">#{item.slug}</span>
                </button>
              );
            })}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <a
                href="#portafolio"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border border-white/10 py-2.5 text-center text-xs font-medium text-zinc-200"
              >
                Evidencias
              </a>
              <a
                href="#faq"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border border-white/10 py-2.5 text-center text-xs font-medium text-zinc-200"
              >
                Preguntas FAQ
              </a>
            </div>
            <a
              href="#contacto"
              onClick={() => setMenuOpen(false)}
              className="tux-cta mt-2 rounded-xl py-2.5 text-center text-sm font-bold"
            >
              Cotizar / Contactar
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
