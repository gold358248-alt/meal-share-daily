"use client";

import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="app-shell">
      <section className="card-surface mx-auto max-w-3xl px-6 py-10 text-center sm:px-10 sm:py-14">
        <p className="eyebrow">Something Went Wrong</p>
        <h1 className="section-title mt-4">画面の表示でエラーが発生しました</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--color-ink-soft)] sm:text-base">
          時間を空けて再読み込みするか、トップ画面からもう一度お試しください。
        </p>
        <p className="mt-3 text-xs text-[var(--color-ink-muted)]">{error.message}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button className="primary-button" onClick={reset} type="button">もう一度試す</button>
          <Link className="secondary-button" href="/">トップへ戻る</Link>
        </div>
      </section>
    </main>
  );
}
