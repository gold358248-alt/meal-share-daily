import Link from "next/link";

export default function NotFound() {
  return (
    <main className="app-shell">
      <section className="card-surface mx-auto max-w-3xl px-6 py-10 text-center sm:px-10 sm:py-14">
        <p className="eyebrow">404 Not Found</p>
        <h1 className="section-title mt-4">ページが見つかりませんでした</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--color-ink-soft)] sm:text-base">
          共有リンクが古いか、URL が変わっている可能性があります。トップ画面からあらためて使い始めてください。
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="primary-button" href="/">トップへ戻る</Link>
          <Link className="secondary-button" href="/planner">すぐに献立を作る</Link>
        </div>
      </section>
    </main>
  );
}
