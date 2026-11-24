import { ArrowRight, CheckCircle2, MessageCircle, ShieldAlert } from "lucide-react";

import { ServiceIcon } from "../../components/ServiceIcon";
import { ShareServiceButton } from "../../components/ShareServiceButton";
import { buildWhatsAppUrl } from "../../lib/whatsapp";
import type {
  ContentMap,
  TabAcademiaPayload,
  TabDesarrolloPayload,
  TabServiceCard,
  TabSlug,
  TabSoportePayload,
} from "../../types/api";

interface TabPanelProps {
  activeTab: TabSlug;
  content: ContentMap;
}

export function TabPanel({ activeTab, content }: TabPanelProps) {
  const whatsappPhone = content.contact_channels?.payload?.whatsapp;

  const section =
    activeTab === "desarrollo"
      ? content.tab_desarrollo
      : activeTab === "soporte"
        ? content.tab_soporte
        : content.tab_academia;

  const devPayload = content.tab_desarrollo?.payload as TabDesarrolloPayload | undefined;
  const supPayload = content.tab_soporte?.payload as TabSoportePayload | undefined;
  const acaPayload = content.tab_academia?.payload as TabAcademiaPayload | undefined;

  const cards: TabServiceCard[] =
    activeTab === "desarrollo"
      ? devPayload?.services || []
      : activeTab === "soporte"
        ? supPayload?.services || []
        : acaPayload?.courses || [];

  const targetAudience = section?.payload?.target_audience;
  const valueProposition = section?.payload?.value_proposition;
  const ctaText = section?.payload?.cta_text || "Solicitar información";
  const whatsappHref = buildWhatsAppUrl(whatsappPhone, section?.payload?.whatsapp_prefill, activeTab);

  return (
    <section
      role="tabpanel"
      aria-label={section?.title || activeTab}
      className="mx-auto max-w-6xl px-5 pt-10 pb-16 sm:px-6"
    >
      {/* Banner de propuesta de valor de la pestaña */}
      <div className="tux-glass relative overflow-hidden rounded-3xl border border-white/10 p-7 sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber-500/12 blur-3xl"
        />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            {targetAudience && (
              <span className="inline-flex items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 font-mono text-[11px] font-medium text-amber-300">
                Para: {targetAudience}
              </span>
            )}
            <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {section?.title}
            </h3>
            {valueProposition && (
              <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">{valueProposition}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#contacto"
              className="tux-cta inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition"
            >
              <span>{ctaText}</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-zinc-950/70 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-amber-400/50 hover:text-amber-200"
              >
                <MessageCircle className="h-4 w-4 text-amber-400" />
                <span>WhatsApp directo</span>
              </a>
            )}
            <ShareServiceButton activeTab={activeTab} sectionTitle={section?.title} />
          </div>
        </div>

        {/* Nota de diagnóstico para Soporte */}
        {activeTab === "soporte" && supPayload?.diagnostico_info && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3.5 text-sm text-amber-100/90">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <p>{supPayload.diagnostico_info}</p>
          </div>
        )}
      </div>

      {/* Grilla de servicios / cursos */}
      <div
        className={`mt-6 grid gap-4 ${
          cards.length === 4 ? "md:grid-cols-2" : "md:grid-cols-3"
        }`}
      >
        {cards.map((card) => (
          <article
            key={card.title}
            className="tux-glass group rounded-2xl border border-white/10 p-6 transition hover:-translate-y-0.5 hover:border-amber-400/40"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400 transition group-hover:scale-105 group-hover:bg-amber-400/15">
              <ServiceIcon name={card.icon} />
            </div>
            <h4 className="text-lg font-bold text-white">{card.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{card.description}</p>
          </article>
        ))}
      </div>

      {/* Opciones de asesoría en Academia */}
      {activeTab === "academia" && (acaPayload?.advisory_options?.length || 0) > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {acaPayload?.advisory_options?.map((opt) => (
            <div
              key={opt.title}
              className="flex items-start gap-3.5 rounded-2xl border border-amber-400/20 bg-zinc-900/60 p-5"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <h5 className="text-sm font-bold text-white">{opt.title}</h5>
                <p className="mt-1 text-sm text-zinc-400">{opt.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
