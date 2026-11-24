import { MoveHorizontal } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  alt: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  alt,
  beforeLabel = "Antes",
  afterLabel = "Después",
  className = "aspect-[16/10]",
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(4, Math.min(96, pct)));
  }, []);

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={0}
      aria-label={`Comparador antes y después: ${alt}`}
      aria-valuemin={4}
      aria-valuemax={96}
      aria-valuenow={Math.round(position)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        updatePosition(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging) updatePosition(e.clientX);
      }}
      onPointerUp={(e) => {
        if (dragging) {
          e.currentTarget.releasePointerCapture(e.pointerId);
          setDragging(false);
        }
      }}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setPosition((p) => Math.max(4, p - 5));
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          setPosition((p) => Math.min(96, p + 5));
        }
      }}
      className={`relative w-full cursor-ew-resize touch-none overflow-hidden bg-zinc-950 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${className}`}
    >
      {/* Imagen Después (capa base) */}
      <img
        src={afterUrl}
        alt={`${alt} — ${afterLabel}`}
        loading="lazy"
        draggable={false}
        className="h-full w-full object-cover"
      />

      {/* Imagen Antes (recortada por clip-path para cero deformación) */}
      <img
        src={beforeUrl}
        alt={`${alt} — ${beforeLabel}`}
        loading="lazy"
        draggable={false}
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Etiquetas flotantes estilo Magnific */}
      <span className="pointer-events-none absolute top-3 left-3 rounded-full border border-white/15 bg-black/70 px-2.5 py-1 font-mono text-[10px] font-medium tracking-wider text-zinc-200 uppercase backdrop-blur-md">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute top-3 right-3 rounded-full border border-amber-400/40 bg-black/70 px-2.5 py-1 font-mono text-[10px] font-medium tracking-wider text-amber-300 uppercase backdrop-blur-md">
        {afterLabel}
      </span>

      {/* Línea divisoria luminosa dorada Tux */}
      <div
        aria-hidden="true"
        style={{ left: `${position}%` }}
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 shadow-[0_0_16px_rgba(251,191,36,0.9)]"
      >
        <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-amber-200/80 bg-zinc-950/90 text-amber-400 shadow-lg shadow-amber-500/30 backdrop-blur">
          <MoveHorizontal className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
