import Link from "next/link";

export function EmptyState() {
  return (
    <section className="app-shell">
      <div className="card-surface mx-auto max-w-3xl p-8 text-center sm:p-12">
        <p className="eyebrow">No Saved Plan</p>
        <h1 className="section-title mt-4">先に条件を入力して献立を作成してください</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--color-ink-soft)] sm:text-base">
          この画面は生成済みの献立があるときに表示されます。共有 URL から来た場合は、
          トップ画面または条件入力画面からそのまま試してください。
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="primary-button" href="/planner">条件入力へ進む</Link>
          <Link className="secondary-button" href="/">トップを見る</Link>
        </div>
      </div>
    </section>
  );
}
