import { GENRE_COLORS } from "@/data/mock";

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
}

export function getGenreColor(genre: string): string {
  const norm = genre.toLowerCase();
  if (GENRE_COLORS[norm]) return GENRE_COLORS[norm];
  const hue = getNameHue(norm);
  return hslToHex(hue, 65, 50); // aesthetic vibrant color
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getNameHue(name: string): number {
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return hash % 360;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function truncateBio(bio: string, maxLen = 200): string {
  const clean = stripHtml(bio);
  if (clean.length <= maxLen) return clean;
  const truncated = clean.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "...";
}
