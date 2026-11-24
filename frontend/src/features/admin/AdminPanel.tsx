import { useQuery } from "@tanstack/react-query";
import { FileText, FolderKanban, Inbox, LogOut, MessageSquareQuote } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { BrandBadge } from "../../components/BrandBadge";
import { ApiError, api } from "../../lib/api";
import { AdminLogin } from "./AdminLogin";
import { ContentEditor } from "./ContentEditor";
import { LeadsInbox } from "./LeadsInbox";
import { PortfolioManager } from "./PortfolioManager";
import { TestimonialsManager } from "./TestimonialsManager";

type AdminTab = "leads" | "portfolio" | "testimonials" | "content";

const ADMIN_TABS: { id: AdminTab; label: string; icon: typeof Inbox }[] = [
  { id: "leads", label: "Leads CRM", icon: Inbox },
  { id: "portfolio", label: "Portafolio", icon: FolderKanban },
  { id: "testimonials", label: "Testimonios", icon: MessageSquareQuote },
  { id: "content", label: "Contenido", icon: FileText },
];

export function AdminPanel() {
  const [token, setToken] = useState<string>(() => sessionStorage.getItem("admin_token") || "");
  const [activeTab, setActiveTab] = useState<AdminTab>("leads");

  const meQuery = useQuery({
    queryKey: ["admin-me", token],
    queryFn: () => api.getMe(token),
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (meQuery.error instanceof ApiError && meQuery.error.status === 401) {
      sessionStorage.removeItem("admin_token");
      setToken("");
    }
  }, [meQuery.error]);

  function handleLoginSuccess(newToken: string) {
    sessionStorage.setItem("admin_token", newToken);
    setToken(newToken);
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_token");
    setToken("");
  }

  if (!token) {
    return <AdminLogin onSuccess={handleLoginSuccess} />;
  }

  if (meQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090D] text-sm text-zinc-400">
        Verificando sesión administrativa...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090D] text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#08090D]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <BrandBadge compact />
            </Link>
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-300 uppercase">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            {meQuery.data?.email && (
              <span className="hidden font-mono text-xs text-zinc-400 sm:inline">
                {meQuery.data.email}
              </span>
            )}
            <Link
              to="/"
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:border-amber-400/40 hover:text-white"
            >
              Ver sitio
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:border-rose-400/40 hover:text-rose-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>

        {/* Barra de 4 pestañas */}
        <div className="mx-auto max-w-6xl px-5 pb-3 sm:px-6">
          <nav className="flex flex-wrap gap-2" aria-label="Secciones administrativas">
            {ADMIN_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "bg-amber-400 text-zinc-950 shadow-sm shadow-amber-400/30"
                      : "border border-white/10 bg-zinc-900/60 text-zinc-300 hover:border-white/25 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
        {activeTab === "leads" && <LeadsInbox token={token} />}
        {activeTab === "portfolio" && <PortfolioManager token={token} />}
        {activeTab === "testimonials" && <TestimonialsManager token={token} />}
        {activeTab === "content" && <ContentEditor token={token} />}
      </main>
    </div>
  );
}
