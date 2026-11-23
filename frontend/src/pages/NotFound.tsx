import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-5xl font-bold text-white">404</h1>
      <p className="mt-3 text-sm text-slate-400">Página no encontrada.</p>
      <Link to="/" className="mt-6 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white">
        Volver al inicio
      </Link>
    </div>
  );
}
