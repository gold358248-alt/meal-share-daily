"use client";

import Link from "next/link";
import { useTrackView } from "@/lib/analytics";
import { SavedPlansPanel } from "@/components/saved-plans-panel";

const steps = [
  { title: "条件を入れる", body: "予算、人数、日数、好み、家にある食材をスマホでさっと入力。" },
  { title: "献立がまとまる", body: "主菜・副菜・汁物を日ごとに見やすく整理。予算超過なら安い候補へ自動調整。" },
  { title: "買い物まで完了", body: "不足食材だけをカテゴリ別に表示。コピーや共有ですぐ家族に送れます。" },
];

const scenes = [
  "仕事帰りの買い物前に、必要なものだけ確認したい",
  "家族にLINEで買い物メモをそのまま送りたい",
  "今ある食材を使い切りながら、数日分のごはんを決めたい",
];

export default function HomePage() {
  useTrackView("home_view");

  return (
    <main className="app-shell space-y-5 sm:space-y-6">
      <section className="card-surface overflow-hidden px-5 py-7 sm:px-8 sm:py-10 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="eyebrow">Nordic Home Flow</p>
            <h1 className="mt-4 font-heading text-[2.35rem] leading-[1.08] tracking-[-0.04em] text-[var(--color-ink)] sm:text-5xl lg:text-6xl">
              予算から献立と
              <br />
              買い物リストまで、
              <br />
              スマホでまとめて。
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-8 text-[var(--color-ink-soft)] sm:text-base">
              「何を作るか決まらない」「買い物メモが散らかる」をまとめて解消。
              予算・人数・日数・好み・家にある食材を入れるだけで、1分以内に数日分の献立と不足食材リストを一気に整えます。
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link className="primary-button" href="/planner">今すぐ3日分つくる</Link>
              <Link className="secondary-button" href="/planner?sample=1">サンプルで試す</Link>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--color-ink-muted)]">家庭向け / 時短 / 節約 / 買い物共有まで一気通貫</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[rgba(255,252,248,0.84)] p-5 shadow-[0_18px_32px_-28px_rgba(35,50,68,0.24)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--color-ink)]">サンプル条件</p>
                <span className="rounded-[var(--radius-pill)] bg-[rgba(241,232,220,0.78)] px-3 py-1 text-xs font-semibold text-[var(--color-ink-soft)]">そのまま試せます</span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm text-[var(--color-ink-soft)]">
                <div className="rounded-[1.25rem] bg-[rgba(241,232,220,0.72)] px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">予算 / 人数 / 日数</dt>
                  <dd className="mt-2 font-semibold text-[var(--color-ink)]">4,800円 / 3人 / 3日</dd>
                </div>
                <div className="rounded-[1.25rem] bg-[rgba(255,255,255,0.82)] px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">好み</dt>
                  <dd className="mt-2 font-semibold text-[var(--color-ink)]">和食、野菜多め、20分以内</dd>
                </div>
                <div className="rounded-[1.25rem] bg-[rgba(255,255,255,0.82)] px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">家にある食材</dt>
                  <dd className="mt-2 font-semibold text-[var(--color-ink)]">玉ねぎ2個、米3合、みそ</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(201,109,70,0.09),rgba(35,50,68,0.04))] px-5 py-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">こんなときに便利</p>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                {scenes.map((scene) => (
                  <li key={scene} className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-clay)]" />
                    <span>{scene}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="grid gap-4 lg:grid-cols-3">
        {steps.map((step, index) => (
          <article className="card-surface p-5 sm:p-6" key={step.title}>
            <p className="eyebrow">Step {index + 1}</p>
            <h2 className="mt-3 text-[1.4rem] font-semibold tracking-[-0.02em] text-[var(--color-ink)]">{step.title}</h2>
            <p className="mt-3 text-sm leading-8 text-[var(--color-ink-soft)]">{step.body}</p>
          </article>
        ))}
      </section>

      <section className="card-surface px-5 py-6 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Quick Start</p>
            <h2 className="mt-3 text-3xl font-heading tracking-[-0.03em] text-[var(--color-ink)]">URL を送れば、そのまま試してもらえる設計です</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-ink-soft)]">
              スマホで見やすい 1 カラム中心の UI、買い物中に使いやすいチェック付きリスト、
              共有しやすいコピー・共有導線までまとめています。
            </p>
            <p className="mt-3 text-xs leading-6 text-[var(--color-ink-muted)]">
              iPhone Safari では「共有」からホーム画面に追加すると、次回からさらにすばやく開けます。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className="primary-button" href="/planner">今すぐ3日分つくる</Link>
            <Link className="secondary-button" href="/planner?sample=1">サンプルで試す</Link>
          </div>
        </div>
      </section>

      <SavedPlansPanel />
    </main>
  );
}
