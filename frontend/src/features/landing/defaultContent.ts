import type { ContentMap } from "../../lib/api";

export const DEFAULT_CONTENT: ContentMap = {
  hero: {
    slug: "hero",
    title: "Soluciones Digitales y Automatización a Medida",
    payload: {
      badge: "Disponible para nuevos proyectos",
      headline: "Construimos software, infraestructura y automatizaciones que escalan tu negocio",
      subheadline:
        "Desde páginas web ultrarrápidas y APIs modernas hasta servidores propios, respaldos seguros y bots de WhatsApp.",
      cta_primary: "Solicitar cotización",
      cta_secondary: "Ver servicios",
    },
  },
  services: {
    slug: "services",
    title: "Servicios Principales",
    payload: {
      items: [
        {
          title: "Desarrollo Web & APIs",
          description:
            "Aplicaciones modernas con React, TypeScript, FastAPI y PostgreSQL optimizadas para velocidad.",
        },
        {
          title: "Automatización y Bots",
          description:
            "Integraciones con WhatsApp, Telegram, ERP y flujos automáticos para ahorrar horas operativas.",
        },
        {
          title: "Infraestructura Linux & Docker",
          description:
            "Servidores Ubuntu seguros, RAID, monitoreo proactivo y respaldos cifrados verificados.",
        },
      ],
    },
  },
  faq: {
    slug: "faq",
    title: "Preguntas Frecuentes",
    payload: {
      items: [
        {
          q: "¿Cuánto tarda un proyecto típico?",
          a: "Una landing dinámica o integración inicial suele entregarse entre 1 y 3 semanas según el alcance.",
        },
        {
          q: "¿Puedo editar los textos e imágenes después?",
          a: "Sí, incluye un panel administrador ligero en /admin para actualizar contenido sin tocar código.",
        },
      ],
    },
  },
};
