"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

type NavItem = {
  label: string;
  href: string;
  num: string;
  match?: (pathname: string) => boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    label: "Discover",
    items: [
      { label: "Home", href: "/", num: "01", match: (p) => p === "/" },
      { label: "Genres", href: "/genres", num: "02" },
      { label: "Frequency", href: "/frequency", num: "03" },
    ],
  },
  {
    label: "Library",
    items: [
      { label: "My Atlas", href: "/my-atlas", num: "05" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "About", href: "/about", num: "07" },
      { label: "Help", href: "/help", num: "08" },
    ],
  },
];

export default function DesktopSidebar() {
  const pathname = usePathname() || "/";
  const { data: session } = useSession();

  const isActive = (item: NavItem) =>
    item.match ? item.match(pathname) : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const hideOn = pathname.startsWith("/login");
  if (hideOn) return null;

  return (
    <aside
      aria-label="Primary navigation"
      className="hidden lg:flex v2 fixed inset-y-0 left-0 w-[240px] z-40 flex-col"
      style={{
        background: "var(--color-edit-bg)",
        borderRight: "1px solid var(--color-edit-line)",
        fontFamily: "var(--font-editorial-body)",
      }}
    >
      {/* Brand */}
      <div
        className="px-5 pt-6 pb-5"
        style={{ borderBottom: "1px solid var(--color-edit-line)" }}
      >
        <Link href="/" className="flex items-center gap-2.5 no-underline group">
          <div
            className="w-[22px] h-[22px] relative shrink-0"
            style={{ border: "1px solid var(--color-edit-ink)" }}
          >
            <div
              className="absolute inset-[3px]"
              style={{ background: "var(--color-edit-accent)" }}
            />
          </div>
          <span
            className="font-medium text-[12.5px] lowercase"
            style={{
              fontFamily: "var(--font-editorial-mono)",
              letterSpacing: "0.02em",
              color: "var(--color-edit-ink)",
            }}
          >
            sonic_//_atlas
          </span>
        </Link>
        <div
          className="mt-3 flex items-center gap-1.5 text-[10px] uppercase"
          style={{
            fontFamily: "var(--font-editorial-mono)",
            letterSpacing: "0.08em",
            color: "var(--color-edit-ink-mute)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--color-edit-accent)" }}
          />
          <span>SYSTEM_STATUS · OPS: OK</span>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-4">
        {SECTIONS.map((section) => (
          <div key={section.label} className="px-3 pb-2 mb-1">
            <div
              className="px-2.5 pb-2 text-[10px] uppercase"
              style={{
                fontFamily: "var(--font-editorial-mono)",
                letterSpacing: "0.12em",
                color: "var(--color-edit-ink-mute)",
              }}
            >
              {section.label}
            </div>
            {section.items.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-item-v2 flex items-center justify-between px-2.5 py-[9px] text-[13.5px] transition-colors no-underline"
                  data-active={active || undefined}
                  style={{
                    fontFamily: "var(--font-editorial)",
                    color: active ? "var(--color-edit-ink)" : "var(--color-edit-ink-dim)",
                    background: active ? "var(--color-edit-bg-2)" : "transparent",
                    borderRadius: "var(--radius)",
                    position: "relative",
                  }}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 -translate-y-1/2"
                      style={{
                        width: "2px",
                        height: "14px",
                        background: "var(--color-edit-accent)",
                      }}
                    />
                  )}
                  <span>{item.label}</span>
                  <span
                    className="text-[10px]"
                    style={{
                      fontFamily: "var(--font-editorial-mono)",
                      color: active ? "var(--color-edit-accent)" : "var(--color-edit-ink-mute)",
                    }}
                  >
                    {item.num}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Foot */}
      <div
        className="px-[18px] py-3.5 text-[10px] uppercase"
        style={{
          borderTop: "1px solid var(--color-edit-line)",
          fontFamily: "var(--font-editorial-mono)",
          letterSpacing: "0.08em",
          color: "var(--color-edit-ink-mute)",
          lineHeight: 1.8,
        }}
      >
        <div className="flex justify-between">
          <span>SHFT5_OS</span>
          <span>V1.0.4</span>
        </div>
        <div className="flex justify-between">
          <span>SESSION</span>
          <span>{session?.user?.id ? `0x${session.user.id.slice(0, 4).toUpperCase()}` : "GUEST"}</span>
        </div>
        <div className="flex justify-between">
          <span>© 2026</span>
          <span>ATLAS_INTEL</span>
        </div>
      </div>

      <style jsx>{`
        .nav-item-v2:hover {
          color: var(--color-edit-ink) !important;
          background: var(--color-edit-bg-1) !important;
        }
      `}</style>
    </aside>
  );
}
