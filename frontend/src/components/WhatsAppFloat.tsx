import { buildWhatsAppUrl } from "../lib/whatsapp";
import type { ContentMap, TabSlug } from "../types/api";

interface WhatsAppFloatProps {
  activeTab: TabSlug;
  content: ContentMap;
}

const CONTEXT_TOOLTIP: Record<TabSlug, string> = {
  desarrollo: "Cotizar proyecto por WhatsApp",
  soporte: "Agendar soporte por WhatsApp",
  academia: "Consultar clases por WhatsApp",
};

export function WhatsAppFloat({ activeTab, content }: WhatsAppFloatProps) {
  const channels = content.contact_channels?.payload;
  const tabSection =
    activeTab === "desarrollo"
      ? content.tab_desarrollo
      : activeTab === "soporte"
        ? content.tab_soporte
        : content.tab_academia;

  const href = buildWhatsAppUrl(
    channels?.whatsapp,
    tabSection?.payload?.whatsapp_prefill || channels?.whatsapp_default_message,
    activeTab,
  );

  if (!href) return null;

  const tooltip = CONTEXT_TOOLTIP[activeTab];

  return (
    <div className="fixed right-5 bottom-5 z-40 flex items-center gap-2.5">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={tooltip}
        className="group flex items-center gap-2.5 rounded-full border border-emerald-400/40 bg-[#0D1412]/90 py-2.5 pr-4 pl-3 text-xs font-semibold text-emerald-100 shadow-[0_12px_36px_-8px_rgba(16,185,129,0.55)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-amber-400/60 hover:bg-[#111A17]"
      >
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-zinc-950 shadow-inner">
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full bg-emerald-400/35 [animation-duration:2.8s]"
          />
          <svg viewBox="0 0 24 24" className="relative h-5 w-5 fill-current" aria-hidden="true">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m5.81 14.08c-.24.68-1.41 1.3-1.95 1.38-.5.07-1.14.1-1.84-.12-.43-.14-.98-.32-1.69-.63-2.97-1.28-4.91-4.27-5.06-4.47-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.59-.37.79-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.59.84 2.04.91 2.19.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.61.17.3.77 1.27 1.65 2.05 1.13 1.01 2.09 1.33 2.39 1.48.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.5.22.57.35.07.12.07.72-.17 1.4z" />
          </svg>
        </span>
        <span className="hidden pr-1 sm:inline">{tooltip}</span>
      </a>
    </div>
  );
}
