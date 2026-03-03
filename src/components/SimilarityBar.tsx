export default function SimilarityBar({ value, showPercentage = false }: { value: number, showPercentage?: boolean }) {
  const barColor =
    value > 0.85 ? "var(--color-shift5-orange)" : value > 0.7 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)";

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-14 h-[2px] bg-white/5 border border-white/5">
        <div
          className="absolute left-0 top-0 h-full transition-all duration-700 ease-out"
          style={{
            width: `${value * 100}%`,
            backgroundColor: barColor,
            boxShadow: value > 0.85 ? '0 0 8px var(--color-shift5-orange)' : 'none'
          }}
        />
      </div>
      {showPercentage && (
        <span className="text-[10px] text-white/30 font-mono tracking-tighter tabular-nums">
          {Math.round(value * 100)}%
        </span>
      )}
    </div>
  );
}
