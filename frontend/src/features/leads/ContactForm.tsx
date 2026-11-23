import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { api } from "../../lib/api";

const leadSchema = z.object({
  name: z.string().min(2, "Escribe tu nombre"),
  email: z.string().email("Correo inválido"),
  phone: z.string().max(40).optional(),
  message: z.string().min(5, "Cuéntanos brevemente tu proyecto"),
  website: z.string().optional(), // Honeypot anti-spam
});

type LeadFormValues = z.infer<typeof leadSchema>;

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({ resolver: zodResolver(leadSchema) });

  const mutation = useMutation({
    mutationFn: (values: LeadFormValues) => api.submitLead({ ...values, source: "landing" }),
    onSuccess: () => reset(),
  });

  return (
    <section id="contacto" className="border-t border-slate-800/80 py-20">
      <div className="mx-auto max-w-xl px-6">
        <h2 className="text-center text-3xl font-bold text-white">Hablemos de tu proyecto</h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Déjanos tus datos y te responderemos en menos de 24 horas.
        </p>

        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="mt-8 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
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

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Nombre</label>
            <input
              {...register("name")}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              placeholder="Tu nombre"
            />
            {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Correo</label>
              <input
                type="email"
                {...register("email")}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                placeholder="correo@ejemplo.com"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">WhatsApp / Teléfono (opcional)</label>
              <input
                {...register("phone")}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                placeholder="+57 300 000 0000"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Mensaje</label>
            <textarea
              rows={4}
              {...register("message")}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              placeholder="Cuéntanos qué necesitas construir o automatizar..."
            />
            {errors.message && <p className="mt-1 text-xs text-rose-400">{errors.message.message}</p>}
          </div>

          {mutation.isError && (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
              {mutation.error.message}
            </p>
          )}
          {mutation.isSuccess && (
            <p className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {mutation.data.message}
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {mutation.isPending ? "Enviando..." : "Enviar mensaje"}
          </button>
        </form>
      </div>
    </section>
  );
}
