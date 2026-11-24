import type { LeadCategory } from "../types/api";

const DEFAULT_WHATSAPP_MESSAGES: Record<LeadCategory, string> = {
  general: "Hola, estoy viendo tu web y quisiera información sobre tus servicios.",
  desarrollo:
    "Hola, me interesa cotizar un proyecto de desarrollo (Aplicación Web / App Android / Sistemas Embebidos).",
  soporte:
    "Hola, tengo un equipo fallando y necesito agendar una revisión técnica o mantenimiento.",
  academia:
    "Hola, busco información sobre clases particulares o asesoría para un proyecto académico.",
};

export function sanitizePhoneForWhatsApp(phone?: string | null): string {
  if (!phone) return "";
  return phone.replace(/[^\d]/g, "");
}

export function buildWhatsAppUrl(
  phone?: string | null,
  message?: string,
  fallbackCategory: LeadCategory = "general",
): string | null {
  const digits = sanitizePhoneForWhatsApp(phone);
  if (!digits) return null;
  const text = (message && message.trim()) || DEFAULT_WHATSAPP_MESSAGES[fallbackCategory];
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function buildLeadReplyWhatsAppUrl(
  leadPhone: string | null,
  leadName: string,
  category: LeadCategory,
): string | null {
  const digits = sanitizePhoneForWhatsApp(leadPhone);
  if (!digits) return null;
  const text = `Hola ${leadName}, recibimos tu solicitud de ${category} en TuxEng. ¿Cómo podemos ayudarte?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
