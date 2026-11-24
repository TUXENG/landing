import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle, Send } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { api } from "../../lib/api";
import { buildWhatsAppUrl } from "../../lib/whatsapp";
import type { ContactChannelsPayload, LeadCategory, LeadModality, TabSlug } from "../../types/api";

const SUBCATEGORY_OPTIONS: Record<LeadCategory, string[]> = {
  desarrollo: [
    "Aplicación Web / Plataforma de Gestión",
    "App Android Kotlin",
    "Backend / API REST",
    "Sistema Embebido / IoT (ESP32)",
    "Otro proyecto de desarrollo",
  ],
  soporte: [
    "Portátil / Laptop",
    "Desktop / Todo en Uno (AIO)",
    "Reparación Electrónica / Tarjeta",
    "Impresora / UPS / Estabilizador",
    "Otro equipo",
  ],
  academia: [
    "Lógica de Programación / Python",
    "Desarrollo Web / Android Kotlin",
    "Electrónica / Arduino / ESP32",
    "Informe de Laboratorio",
    "Proyecto Final / Maqueta",
    "Proyecto de Grado",
    "Otra tutoría",
  ],
  general: ["Consulta general", "Alianza o cotización mixta"],
};

const MESSAGE_PLACEHOLDERS: Record<LeadCategory, string> = {
  desarrollo: "Cuéntame qué plataforma, app o prototipo deseas construir y los objetivos clave...",
  soporte: "Describe marca/modelo del equipo y el síntoma o falla que presenta...",
  academia: "Indica el tema que quieres reforzar, nivel actual o detalles de tu proyecto académico...",
  general: "Cuéntame brevemente en qué te puedo ayudar...",
};

const leadSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre completo").max(120),
  email: z.string().trim().email("Ingresa un correo válido"),
  phone: z.string().trim().max(40).optional(),
  service_category: z.enum(["desarrollo", "soporte", "academia", "general"]),
  subcategory: z.string().max(64).optional(),
  modality: z.enum(["", "presencial", "remoto", "hibrido"]).optional(),
  estimated_budget: z.string().max(64).optional(),
  message: z.string().trim().min(5, "Cuéntame un poco más de detalle (mínimo 5 caracteres)").max(2000),
  website: z.string().max(120).optional(), // Honeypot anti-spam
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface ContactFormProps {
  activeTab: TabSlug;
  channels?: ContactChannelsPayload;
}

export function ContactForm({ activeTab, channels }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      service_category: activeTab,
      subcategory: "",
      modality: "",
      estimated_budget: "",
      website: "",
    },
  });

  // Sincroniza la categoría del formulario cuando el visitante cambia de pestaña
  useEffect(() => {
    setValue("service_category", activeTab);
    setValue("subcategory", "");
  }, [activeTab, setValue]);

  const selectedCategory = watch("service_category") as LeadCategory;

  const mutation = useMutation({
    mutationFn: (values: LeadFormValues) =>
      api.submitLead({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        service_category: values.service_category,
        subcategory: values.subcategory || undefined,
        modality: (values.modality || undefined) as LeadModality | undefined,
        estimated_budget: values.estimated_budget || undefined,
        message: values.message,
        source: `landing_${values.service_category}`,
        website: values.website || "",
      }),
    onSuccess: () => {
      reset({
        name: "",
        email: "",
        phone: "",
        service_category: activeTab,
        subcategory: "",
        modality: "",
        estimated_budget: "",
        message: "",
        website: "",
      });
    },
  });

  const whatsappAfterSubmit = buildWhatsAppUrl(channels?.whatsapp, undefined, selectedCategory);

  return (
    <section id="contacto" className="scroll-mt-24 border-t border-white/8 py-20">
      <div className="mx-auto max-w-2xl px-5 sm:px-6">
        <div className="text-center">
          <span className="font-mono text-xs font-medium tracking-widest text-amber-400 uppercase">
            Contacto Directo
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Hablemos de tu solicitud
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            El formulario se adapta automáticamente a la pestaña activa. Respuesta directa sin intermediarios.
          </p>
        </div>

        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="tux-glass mt-9 space-y-5 rounded-3xl border border-white/10 p-6 sm:p-8"
        >
          {/* Campo honeypot oculto para bots */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
            {...register("website")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Nombre completo *</label>
              <input
                {...register("name")}
                placeholder="Tu nombre"
                className="w-full rounded-xl border border-white/10 bg-zinc-950/90 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400/70 focus:outline-none"
              />
              {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                WhatsApp / Teléfono
              </label>
              <input
                {...register("phone")}
                placeholder="+57 300 000 0000"
                className="w-full rounded-xl border border-white/10 bg-zinc-950/90 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400/70 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Correo electrónico *</label>
            <input
              type="email"
              {...register("email")}
              placeholder="correo@ejemplo.com"
              className="w-full rounded-xl border border-white/10 bg-zinc-950/90 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400/70 focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Área de servicio</label>
              <select
                {...register("service_category")}
                className="w-full rounded-xl border border-white/10 bg-zinc-950/90 px-3.5 py-2.5 text-sm text-white focus:border-amber-400/70 focus:outline-none"
              >
                <option value="desarrollo">Desarrollo y Proyectos</option>
                <option value="soporte">Soporte Técnico y Reparación</option>
                <option value="academia">Clases y Proyectos Académicos</option>
                <option value="general">Consulta General</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                {selectedCategory === "soporte"
                  ? "Tipo de equipo"
                  : selectedCategory === "academia"
                    ? "Tema o enfoque"
                    : "Especialidad"}
              </label>
              <select
                {...register("subcategory")}
                className="w-full rounded-xl border border-white/10 bg-zinc-950/90 px-3.5 py-2.5 text-sm text-white focus:border-amber-400/70 focus:outline-none"
              >
                <option value="">Selecciona una opción (opcional)</option>
                {SUBCATEGORY_OPTIONS[selectedCategory].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campos condicionales por categoría */}
          {selectedCategory !== "general" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Modalidad</label>
                <select
                  {...register("modality")}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/90 px-3.5 py-2.5 text-sm text-white focus:border-amber-400/70 focus:outline-none"
                >
                  <option value="">Sin preferencia</option>
                  <option value="remoto">Remoto / Virtual</option>
                  <option value="presencial">Presencial</option>
                  <option value="hibrido">Híbrido</option>
                </select>
              </div>

              {selectedCategory === "desarrollo" && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                    Presupuesto estimado (opcional)
                  </label>
                  <input
                    {...register("estimated_budget")}
                    placeholder="Ej. $1M - $3M COP / Por definir"
                    className="w-full rounded-xl border border-white/10 bg-zinc-950/90 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400/70 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Mensaje / Detalles *</label>
            <textarea
              rows={4}
              {...register("message")}
              placeholder={MESSAGE_PLACEHOLDERS[selectedCategory]}
              className="w-full rounded-xl border border-white/10 bg-zinc-950/90 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-amber-400/70 focus:outline-none"
            />
            {errors.message && <p className="mt-1 text-xs text-rose-400">{errors.message.message}</p>}
          </div>

          {mutation.isError && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              {mutation.error.message}
            </div>
          )}

          {mutation.isSuccess && (
            <div className="space-y-3 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4 text-xs text-emerald-200">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>{mutation.data.message}</span>
              </div>
              {whatsappAfterSubmit && (
                <a
                  href={whatsappAfterSubmit}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3.5 py-1.5 font-semibold text-emerald-200 transition hover:bg-emerald-400/25"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Acelerar respuesta por WhatsApp</span>
                </a>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="tux-cta inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>{mutation.isPending ? "Enviando solicitud..." : "Enviar solicitud"}</span>
          </button>
        </form>
      </div>
    </section>
  );
}
