import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { TabSlug } from "../types/api";

interface ShareServiceButtonProps {
  activeTab: TabSlug;
  sectionTitle?: string;
}

const SHARE_TITLES: Record<TabSlug, string> = {
  desarrollo: "TuxEng — Desarrollo de Software, Apps Kotlin y Sistemas Embebidos",
  soporte: "TuxEng — Soporte Técnico y Reparación Electrónica Especializada",
  academia: "TuxEng — Clases Personalizadas, Informes y Proyectos Académicos",
};

export function ShareServiceButton({ activeTab, sectionTitle }: ShareServiceButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/#${activeTab}` : `/#${activeTab}`;
  const shareText = `${sectionTitle || SHARE_TITLES[activeTab]} — ${shareUrl}`;
  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1600);
  }

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: SHARE_TITLES[activeTab],
          text: sectionTitle || SHARE_TITLES[activeTab],
          url: shareUrl,
        });
        setOpen(false);
        return;
      } catch {
        // Usuario canceló o navegador no permitió compartir; abrir menú fallback
      }
    }
    setOpen((v) => !v);
  }

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        type="button"
        onClick={handleNativeShare}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-zinc-950/70 px-4 py-3 text-xs font-semibold text-zinc-200 transition hover:border-amber-400/50 hover:text-amber-200"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-emerald-300">¡Enlace copiado!</span>
          </>
        ) : (
          <>
            <Share2 className="h-3.5 w-3.5 text-amber-400" />
            <span>Compartir servicio</span>
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 rounded-2xl border border-white/15 bg-[#101219]/95 p-1.5 shadow-2xl backdrop-blur-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleCopy}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-200 transition hover:bg-white/5 hover:text-amber-300"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Link2 className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span>{copied ? "¡Enlace copiado!" : `Copiar enlace (#${activeTab})`}</span>
          </button>

          <a
            role="menuitem"
            href={whatsappShareHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-zinc-200 transition hover:bg-white/5 hover:text-emerald-300"
          >
            <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>Enviar por WhatsApp</span>
          </a>
        </div>
      )}
    </div>
  );
}
