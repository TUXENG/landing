import type { ContentMap } from "../../types/api";

// Sincronizado con `DEFAULT_SECTIONS` de `backend/app/services/content_service.py` y `seed.py`.
export const DEFAULT_CONTENT: ContentMap = {
  hero: {
    slug: "hero",
    title: "Soluciones Integrales en Desarrollo de Software, Electrónica y Soporte Técnico",
    payload: {
      badge: "Disponible para proyectos, soporte y asesorías",
      title: "Soluciones Integrales en Desarrollo de Software, Electrónica y Soporte Técnico",
      subtitle:
        "Desde aplicaciones web dinámicas a medida, plataformas de gestión y apps móviles en Kotlin hasta sistemas embebidos, reparación electrónica y formación técnica. Resultados comprobados con evidencia real.",
      cta_primary_text: "Explorar servicios",
      cta_whatsapp_text: "Hablar por WhatsApp",
      trust_pillars: [
        {
          title: "Perfil Técnico Integral",
          description:
            "Dominio tanto del software de alto nivel como del hardware y la electrónica a nivel de componente.",
        },
        {
          title: "Evidencia Comprobable",
          description:
            "Portafolio documentado con casos reales, prototipos funcionando y reparaciones exitosas.",
        },
        {
          title: "Atención Directa y Sin Intermediarios",
          description:
            "Trato directo con el especialista desde el diagnóstico o diseño hasta la entrega final.",
        },
      ],
    },
  },
  tab_desarrollo: {
    slug: "tab_desarrollo",
    title: "Desarrollo y Proyectos a Medida",
    payload: {
      target_audience: "Empresas, startups, comercios y emprendedores",
      value_proposition:
        "Transformamos tus procesos e ideas en aplicaciones web de alto rendimiento, plataformas de gestión a medida, aplicaciones móviles nativas y sistemas embebidos listos para producción.",
      cta_text: "Cotizar mi proyecto",
      whatsapp_prefill:
        "Hola, me interesa cotizar un proyecto de desarrollo (Aplicación Web / App Android / Sistemas Embebidos).",
      services: [
        {
          title: "Aplicaciones Web y Plataformas a Medida",
          description:
            "ERP/CRM liviano, inventarios, cotizadores, dashboards administrativos y SPAs rápidas con React, TypeScript y Tailwind.",
          icon: "globe",
        },
        {
          title: "Backend, APIs REST e Infraestructura",
          description:
            "APIs seguras con FastAPI (Python), PostgreSQL, Redis, Docker e integración con pasarelas de pago y webhooks.",
          icon: "server",
        },
        {
          title: "Desarrollo Móvil Nativo (Kotlin / Android)",
          description: "Aplicaciones Android modernas con Jetpack Compose conectadas a APIs en la nube.",
          icon: "smartphone",
        },
        {
          title: "Sistemas Embebidos e IoT",
          description:
            "Diseño de circuitos, programación de ESP32, Arduino, STM32 y Raspberry Pi con telemetría web (MQTT / WebSockets / Bluetooth).",
          icon: "cpu",
        },
      ],
    },
  },
  tab_soporte: {
    slug: "tab_soporte",
    title: "Soporte Técnico y Reparación Electrónica",
    payload: {
      target_audience: "Hogares, oficinas, comercios y usuarios con equipos fallando",
      value_proposition:
        "Diagnóstico preciso, mantenimiento preventivo y reparación electrónica especializada con garantía.",
      diagnostico_info:
        "Evaluación transparente antes de intervenir el equipo, con evidencia fotográfica del antes y después.",
      cta_text: "Agendar revisión técnica",
      whatsapp_prefill:
        "Hola, tengo un equipo fallando y necesito agendar una revisión técnica o mantenimiento.",
      services: [
        {
          title: "Mantenimiento Preventivo y Correctivo de Cómputo",
          description:
            "Portátiles, computadores de escritorio y Todo en Uno (AIO). Limpieza interna, cambio de pasta térmica y optimización.",
          icon: "laptop",
        },
        {
          title: "Periféricos y Sistemas de Energía",
          description: "Revisión y mantenimiento de impresoras, UPS y estabilizadores para hogar y oficina.",
          icon: "zap",
        },
        {
          title: "Reparación Electrónica Especializada",
          description:
            "Diagnóstico de fallas en tarjetas electrónicas, reemplazo de componentes y recuperación de equipos.",
          icon: "wrench",
        },
      ],
    },
  },
  tab_academia: {
    slug: "tab_academia",
    title: "Clases y Proyectos Académicos",
    payload: {
      target_audience: "Estudiantes de colegio, técnica, universidad y autodidactas",
      value_proposition:
        "Domina la programación y la electrónica con clases prácticas o saca adelante tu proyecto académico con asesoría experta.",
      cta_text: "Consultar clase o asesoría",
      whatsapp_prefill:
        "Hola, busco información sobre clases particulares o asesoría para un proyecto académico.",
      courses: [
        {
          title: "Lógica de Programación y Python",
          description: "Fundamentos sólidos, estructuras de datos y proyectos prácticos desde cero.",
          icon: "code",
        },
        {
          title: "Desarrollo Web y Android (Kotlin)",
          description: "Construcción guiada de aplicaciones reales con React, FastAPI o Kotlin.",
          icon: "layers",
        },
        {
          title: "Electrónica Básica, Digital y Microcontroladores",
          description: "Circuitos, simulaciones en Proteus/Tinkercad y programación en Arduino/ESP32.",
          icon: "circuit-board",
        },
      ],
      advisory_options: [
        {
          title: "Tutorías 1 a 1 (Virtual o Presencial)",
          description: "Sesiones enfocadas en resolver dudas concretas, talleres y exámenes.",
        },
        {
          title: "Informes de Laboratorio",
          description:
            "Apoyo técnico en análisis de resultados, cálculos, gráficas y redacción estructurada de prácticas.",
        },
        {
          title: "Proyectos Finales y Maquetas",
          description:
            "Diseño, simulación, programación y montaje funcional para entregas de materias prácticas.",
        },
        {
          title: "Asesoría de Proyectos de Grado",
          description:
            "Acompañamiento integral en arquitectura, prototipo hardware/software, pruebas y sustentación.",
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
          category: "general",
          question: "¿Cómo solicito una cotización o diagnóstico?",
          answer:
            "Puedes escribir directamente por WhatsApp desde la pestaña del servicio que necesitas o enviar el formulario de contacto; responderemos con los siguientes pasos.",
        },
        {
          category: "desarrollo",
          question: "¿Cuánto tarda el desarrollo de una aplicación web o app móvil?",
          answer:
            "Una landing dinámica o MVP inicial suele entregarse entre 1 y 3 semanas; plataformas más grandes se planifican por entregas semanales verificables.",
        },
        {
          category: "soporte",
          question: "¿Entregan diagnóstico antes de reparar el equipo?",
          answer:
            "Sí. Primero realizamos revisión técnica y te informamos el fallo exacto y el costo antes de proceder con cualquier reparación.",
        },
        {
          category: "academia",
          question: "¿Las clases y asesorías son virtuales o presenciales?",
          answer:
            "Ofrecemos modalidad virtual para cualquier ciudad y presencial o híbrida según disponibilidad y tipo de práctica (especialmente en electrónica).",
        },
      ],
    },
  },
  contact_channels: {
    slug: "contact_channels",
    title: "Canales de Contacto y Redes Sociales",
    payload: {
      whatsapp: "573000000000",
      whatsapp_default_message: "Hola, estoy viendo tu web y quisiera información sobre tus servicios.",
      email: "contacto@tudominio.com",
      github: "https://github.com/tu-usuario",
      linkedin: "https://linkedin.com/in/tu-usuario",
      youtube: "",
      instagram: "",
      tiktok: "",
    },
  },
};
