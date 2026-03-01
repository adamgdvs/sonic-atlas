import { getInitials, getNameHue } from "@/lib/utils";

export default function ArtistInitials({
  name,
  size = 40,
}: {
  name: string;
  size?: number;
}) {
  const initials = getInitials(name);
  const hue = getNameHue(name);

  return (
    <div
      className="flex items-center justify-center font-semibold"
      style={{
        width: size,
        height: size,
        minWidth: size,
        backgroundColor: `hsl(${hue}, 25%, 88%)`,
        color: `hsl(${hue}, 30%, 40%)`,
        fontSize: size * 0.35,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
}
