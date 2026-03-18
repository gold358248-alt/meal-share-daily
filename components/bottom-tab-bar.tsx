"use client";

import Link from "next/link";
import { NavItem } from "@/components/header-nav";

export function BottomTabBar({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate: (item: NavItem) => void;
}) {
  return (
    <div className="sticky-mobile-bar md:hidden">
      <nav className="mx-auto grid max-w-5xl grid-cols-4 gap-2">
        {items.map((item) =>
          item.disabled ? (
            <button
              className="flex min-h-[60px] flex-col items-center justify-center rounded-[var(--radius-control)] bg-[rgba(255,252,248,0.68)] px-2 text-center text-[11px] font-semibold text-[var(--color-ink-muted)]"
              key={item.href}
              onClick={() => onNavigate(item)}
              type="button"
            >
              <span className="mb-1 h-2.5 w-2.5 rounded-full bg-stone-300" />
              {item.label}
            </button>
          ) : (
            <Link
              className={`flex min-h-[60px] flex-col items-center justify-center rounded-[var(--radius-control)] px-2 text-center text-[11px] font-semibold ${
                item.active ? "bg-[var(--color-ink)] text-white shadow-[0_16px_24px_-22px_rgba(35,50,68,0.8)]" : "bg-[rgba(255,252,248,0.7)] text-[var(--color-ink-soft)]"
              }`}
              href={item.href}
              key={item.href}
            >
              <span className={`mb-1 h-2.5 w-2.5 rounded-full ${item.active ? "bg-white" : "bg-[var(--color-clay)]"}`} />
              {item.label}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}
