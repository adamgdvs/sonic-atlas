"use client";

export default function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer transition-all duration-150 text-xs font-medium tracking-wide"
      style={{
        padding: "5px 14px",
        border: active ? "1px solid #1D1D1F" : "1px solid #E5E5E5",
        backgroundColor: active ? "#1D1D1F" : "#FFF",
        color: active ? "#FFF" : "#6B7280",
      }}
    >
      {label}
    </button>
  );
}
