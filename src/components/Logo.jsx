/**
 * VeloQube wordmark: an isometric cube plus the name. Drawn as inline SVG so it
 * scales cleanly and needs no image file. Designed to sit on the navy header.
 */
export function Logo({ size = "md" }) {
  const cube = size === "lg" ? 56 : 36;
  const text = size === "lg" ? "text-4xl" : "text-2xl";
  const tag = size === "lg" ? "text-xs" : "text-[10px]";

  return (
    <div className="flex items-center gap-3" role="img" aria-label="VeloQube Sample">
      <svg width={cube} height={cube} viewBox="0 0 32 32" aria-hidden="true">
        <polygon points="16,2 28,9 16,16 4,9" fill="#38BDF8" />
        <polygon points="4,9 16,16 16,30 4,23" fill="#1D4ED8" />
        <polygon points="28,9 28,23 16,30 16,16" fill="#2563EB" />
      </svg>
      <div className="leading-none">
        <div className={`${text} font-bold tracking-tight text-white`}>
          Velo<span className="text-[#38BDF8]">Qube</span>
        </div>
        <div className={`${tag} mt-1 font-semibold uppercase tracking-[0.25em] text-white/60`}>
          Sample
        </div>
      </div>
    </div>
  );
}

export default Logo;
