"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

const STATUS_MAP = {
  "/": {
    step: 0,
    title: "ホーム",
    body: "アプリの流れを確認して、そのまま条件入力へ進めます。",
  },
  "/planner": {
    step: 1,
    title: "条件入力",
    body: "予算や好みを入れて、献立と買い物リストの準備を始めます。",
  },
  "/results": {
    step: 2,
    title: "献立結果",
    body: "日ごとの献立を見比べながら、予算や時短に合わせて再調整できます。",
  },
  "/shopping": {
    step: 3,
    title: "買い物リスト",
    body: "不足食材だけを整理して、チェックや共有にそのまま使えます。",
  },
} as const;

export function PageStatus() {
  const pathname = usePathname();

  const status = useMemo(() => {
    return STATUS_MAP[pathname as keyof typeof STATUS_MAP] ?? STATUS_MAP["/"];
  }, [pathname]);

  const progressWidth = status.step === 0 ? "0%" : `${(status.step / 3) * 100}%`;

  return (
    <section className="app-shell pb-0 pt-1 sm:pt-2">
      <div className="card-surface animate-rise px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">
              {status.step === 0 ? "Start Guide" : `Step ${status.step} / 3`}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--color-ink)] sm:text-2xl">
              現在の画面: {status.title}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--color-ink-soft)]">
              {status.body}
            </p>
          </div>
          <div className="min-w-0 rounded-[1.5rem] bg-[rgba(241,232,220,0.55)] px-4 py-4 lg:w-[320px]">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
              <span>進行状況</span>
              <span>{status.step} / 3</span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-[rgba(255,255,255,0.78)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-clay),var(--color-ink))] transition-[width] duration-500"
                style={{ width: progressWidth }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-[var(--color-ink-muted)]">
              <span className={status.step >= 1 ? "text-[var(--color-ink)]" : undefined}>条件入力</span>
              <span className={status.step >= 2 ? "text-[var(--color-ink)]" : undefined}>献立結果</span>
              <span className={status.step >= 3 ? "text-[var(--color-ink)]" : undefined}>買い物</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
