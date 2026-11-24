export function BrandBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      {/* Monograma minimalista inspirado en Tux (obsidiana + pecho blanco + pico dorado) */}
      <span className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-amber-400/35 bg-gradient-to-b from-zinc-900 to-black shadow-lg shadow-amber-500/10">
        <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
          <ellipse cx="16" cy="18" rx="9" ry="10" fill="#18181B" stroke="#FBBF24" strokeWidth="1.2" />
          <ellipse cx="16" cy="20" rx="5.5" ry="6.5" fill="#F8FAFC" />
          <circle cx="13.2" cy="12" r="1.4" fill="#F8FAFC" />
          <circle cx="18.8" cy="12" r="1.4" fill="#F8FAFC" />
          <path d="M12.5 14.8 L16 17.6 L19.5 14.8 Z" fill="#F59E0B" />
          <ellipse cx="11.5" cy="27.2" rx="3" ry="1.4" fill="#F97316" />
          <ellipse cx="20.5" cy="27.2" rx="3" ry="1.4" fill="#F97316" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-extrabold tracking-tight text-white">
          Tux<span className="text-amber-400">Eng</span>
        </span>
        {!compact && (
          <span className="mt-0.5 font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
            Software · Hardware
          </span>
        )}
      </span>
    </span>
  );
}
