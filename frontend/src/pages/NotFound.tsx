import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { BrandBadge } from "../components/BrandBadge";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#08090D] px-6 text-center text-zinc-100">
      <BrandBadge compact />
      <p className="mt-8 font-mono text-xs font-semibold tracking-widest text-amber-400 uppercase">
        Error 404
      </p>
      <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">Página no encontrada</h1>
      <p className="mt-3 max-w-md text-sm text-zinc-400">
        La ruta que buscas no existe o fue movida. Puedes volver al inicio y explorar los servicios.
      </p>
      <Link
        to="/"
        className="tux-cta mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Volver al inicio</span>
      </Link>
    </div>
  );
}
