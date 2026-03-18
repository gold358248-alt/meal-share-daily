"use client";

import Link from "next/link";

export interface NavItem {
  href: string;
  label: string;
  active: boolean;
  disabled: boolean;
}

export function HeaderNav({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate: (item: NavItem) => void;
}) {
  return (
    <div className="hidden md:block">
      <div className="app-shell pb-3 pt-4">
        <div className="card-surface flex items-center justify-between px-5 py-4 sm:px-6">
          <Link className="font-heading text-xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]" href="/">
            おうち献立ノート
          </Link>
          <nav className="flex flex-wrap gap-2">
            {items.map((item) =>
              item.disabled ? (
                <button
                  className="inline-flex min-h-[46px] items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[rgba(255,252,248,0.72)] px-4 text-sm font-semibold text-[var(--color-ink-muted)]"
                  key={item.href}
                  onClick={() => onNavigate(item)}
                  type="button"
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  className={`inline-flex min-h-[46px] items-center justify-center rounded-[var(--radius-control)] px-4 text-sm font-semibold ${
                    item.active
                      ? "bg-[var(--color-ink)] text-white shadow-[0_14px_24px_-22px_rgba(35,50,68,0.9)]"
                      : "border border-[var(--color-border)] bg-[rgba(255,252,248,0.72)] text-[var(--color-ink-soft)]"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
