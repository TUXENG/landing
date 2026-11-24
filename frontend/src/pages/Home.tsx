import { useQuery } from "@tanstack/react-query";

import { WhatsAppFloat } from "../components/WhatsAppFloat";
import { DEFAULT_CONTENT } from "../features/landing/defaultContent";
import { FaqSection } from "../features/landing/FaqSection";
import { Footer } from "../features/landing/Footer";
import { Hero } from "../features/landing/Hero";
import { Navbar } from "../features/landing/Navbar";
import { PortfolioGallery } from "../features/landing/PortfolioGallery";
import { ServiceTabs } from "../features/landing/ServiceTabs";
import { TabPanel } from "../features/landing/TabPanel";
import { TestimonialsSection } from "../features/landing/TestimonialsSection";
import { ContactForm } from "../features/leads/ContactForm";
import { useActiveTab } from "../hooks/useActiveTab";
import { api } from "../lib/api";
import { buildWhatsAppUrl } from "../lib/whatsapp";

export function Home() {
  const { activeTab, selectTab } = useActiveTab("desarrollo");

  const { data } = useQuery({
    queryKey: ["content"],
    queryFn: api.getContent,
    initialData: DEFAULT_CONTENT,
    staleTime: 60_000,
    retry: 1,
  });

  const content = data || DEFAULT_CONTENT;
  const heroPayload = content.hero?.payload || DEFAULT_CONTENT.hero!.payload;
  const channels = content.contact_channels?.payload || DEFAULT_CONTENT.contact_channels!.payload;
  const faqItems = content.faq?.payload?.items || DEFAULT_CONTENT.faq!.payload.items || [];
  const heroWhatsappUrl = buildWhatsAppUrl(
    channels.whatsapp,
    channels.whatsapp_default_message,
    "general",
  );

  return (
    <div className="min-h-screen bg-[#08090D] text-zinc-50">
      <Navbar activeTab={activeTab} onSelectTab={selectTab} channels={channels} />

      <main>
        <Hero hero={heroPayload} whatsappUrl={heroWhatsappUrl} />
        <ServiceTabs activeTab={activeTab} onSelectTab={(tab) => selectTab(tab, false)} />
        <TabPanel activeTab={activeTab} content={content} />
        <PortfolioGallery activeTab={activeTab} />
        <TestimonialsSection activeTab={activeTab} />
        <FaqSection
          title={content.faq?.title || "Preguntas Frecuentes"}
          items={faqItems}
          activeTab={activeTab}
        />
        <ContactForm activeTab={activeTab} channels={channels} />
      </main>

      <Footer channels={channels} activeTab={activeTab} onSelectTab={selectTab} />
      <WhatsAppFloat activeTab={activeTab} content={content} />
    </div>
  );
}
