"use client";

import Link from "next/link";
import { useTrackView } from "@/lib/analytics";
import { SavedPlansPanel } from "@/components/saved-plans-panel";

export default function HomePage() {
  useTrackView("home_view");

  return (
    <main className="app-shell space-y-4 sm:space-y-5">
      <section className="card-surface overflow-hidden px-5 py-7 sm:px-8 sm:py-9">
        <div className="space-y-5">
          <div>
            <p className="eyebrow">Meal Decision App</p>
            <h1 className="mt-4 font-heading text-[2.35rem] leading-[1.08] tracking-[-0.04em] text-[var(--color-ink)] sm:text-5xl">
              食べたい献立を、
              <br />
              予算内でまとめて決める。
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[var(--color-ink-soft)] sm:text-base">
              気分に合う複数日分の献立と、必要な買い物リストまで一気に整います。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link className="primary-button !min-h-[58px] !text-base" href="/planner?mode=easy">
              すぐ決める
            </Link>
            <Link className="secondary-button !min-h-[58px] !text-base" href="/planner?mode=detailed">
              こだわって決める
            </Link>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(255,252,248,0.86)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--color-ink)]">こんな感じで使えます</p>
              <Link className="secondary-button !min-h-[40px] !px-4 !text-sm" href="/planner?sample=1">
                試してみる
              </Link>
            </div>
            <dl className="mt-3 grid gap-2 text-sm leading-6 text-[var(--color-ink-soft)]">
              <div className="flex items-center justify-between gap-4">
                <dt>予算 / 人数 / 日数</dt>
                <dd className="font-semibold text-[var(--color-ink)]">4,800円 / 3人 / 3日</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>好み</dt>
                <dd className="font-semibold text-[var(--color-ink)]">和食、野菜多め、家庭的</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>家にある食材</dt>
                <dd className="font-semibold text-[var(--color-ink)]">米、玉ねぎ、みそ</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <SavedPlansPanel />
    </main>
  );
}
