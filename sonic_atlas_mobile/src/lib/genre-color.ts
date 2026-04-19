const GENRE_COLORS: Record<string, string> = {
  ambient: "#4C6FFF",
  techno: "#FF5841",
  jazz: "#D2A84C",
  shoegaze: "#8D6BFF",
  metal: "#8A8A8A",
  soul: "#E06E50",
  house: "#29B6A6",
  punk: "#E53935",
  disco: "#FFB300",
  folk: "#66BB6A",
};

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
}

export function getGenreColor(genre: string): string {
  const normalized = genre.trim().toLowerCase();
  if (GENRE_COLORS[normalized]) {
    return GENRE_COLORS[normalized];
  }

  const hash = normalized.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return hslToHex(hash % 360, 65, 50);
}
