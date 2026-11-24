import { Mail } from "lucide-react";
import { Link } from "react-router-dom";

import { BrandBadge } from "../../components/BrandBadge";
import { SocialLinks } from "../../components/SocialLinks";
import type { ContactChannelsPayload, TabSlug } from "../../types/api";

interface FooterProps {
  channels?: ContactChannelsPayload;
  activeTab: TabSlug;
  onSelectTab: (tab: TabSlug, scroll?: boolean) => void;
}

export function Footer({ channels, activeTab, onSelectTab }: FooterProps) {
  return (
    <footer className="border-t border-white/8 bg-[#06070A] py-14 pb-24 sm:pb-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-start">
          <div>
            <BrandBadge />
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-zinc-400">
              Desarrollo web, apps móviles Kotlin, sistemas embebidos, soporte técnico especializado y
              formación práctica.
            </p>
            {channels?.email && (
              <a
                href={`mailto:${channels.email}`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-zinc-300 transition hover:text-amber-300"
              >
                <Mail className="h-3.5 w-3.5 text-amber-400" />
                <span>{channels.email}</span>
              </a>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-zinc-400">
              <button
                type="button"
                onClick={() => onSelectTab("desarrollo", true)}
                className="transition hover:text-amber-300"
              >
                #desarrollo
              </button>
              <button
                type="button"
                onClick={() => onSelectTab("soporte", true)}
                className="transition hover:text-amber-300"
              >
                #soporte
              </button>
              <button
                type="button"
                onClick={() => onSelectTab("academia", true)}
                className="transition hover:text-amber-300"
              >
                #academia
              </button>
              <a href="#portafolio" className="transition hover:text-amber-300">
                #portafolio
              </a>
              <a href="#faq" className="transition hover:text-amber-300">
                #faq
              </a>
            </div>

            <SocialLinks channels={channels} activeTab={activeTab} variant="pills" />
          </div>
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-6 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} TuxEng · Todos los derechos reservados.</p>
          <Link to="/admin" className="font-mono text-zinc-500 transition hover:text-amber-400">
            /admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
