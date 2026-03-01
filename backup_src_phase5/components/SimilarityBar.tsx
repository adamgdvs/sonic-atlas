export default function SimilarityBar({ value }: { value: number }) {
  const barColor =
    value > 0.85 ? "#1D1D1F" : value > 0.7 ? "#6B7280" : "#A1A1AA";

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-12 h-[3px] bg-[#E5E5E5]">
        <div
          className="absolute left-0 top-0 h-[3px]"
          style={{
            width: `${value * 100}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
      <span className="text-[11px] text-[#A1A1AA] font-medium tabular-nums">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
