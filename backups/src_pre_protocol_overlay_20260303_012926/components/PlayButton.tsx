"use client";

export default function PlayButton({ small }: { small?: boolean }) {
  const s = small ? 28 : 36;
  const iconSize = small ? 10 : 12;

  return (
    <button
      className="flex items-center justify-center border border-[#E5E5E5] bg-[#FAFAFA] text-[#1D1D1F] cursor-pointer transition-all duration-150 shrink-0 hover:bg-[#1D1D1F] hover:text-white hover:border-[#1D1D1F]"
      style={{ width: s, height: s }}
      title="Preview"
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 12 12"
        fill="currentColor"
      >
        <polygon points="2,0 12,6 2,12" />
      </svg>
    </button>
  );
}
