import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { PlanSummary } from "@/types";

export function BudgetSummary({ summary, dayCount }: { summary: PlanSummary; dayCount: number }) {
  const savingsLabel = formatCurrency(Math.abs(summary.difference));

  return (
    <section className="card-surface overflow-hidden">
      <div className={`border-b px-5 py-5 sm:px-7 ${summary.withinBudget ? "border-[rgba(125,148,128,0.16)] bg-[linear-gradient(135deg,rgba(237,243,236,0.95),rgba(255,252,248,0.82))]" : "border-[rgba(201,109,70,0.16)] bg-[linear-gradient(135deg,rgba(248,236,232,0.95),rgba(255,252,248,0.82))]"}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Plan Summary</p>
            <h2 className="mt-3 text-2xl font-heading tracking-[-0.03em] text-[var(--color-ink)] sm:text-3xl">
              {summary.withinBudget ? "予算内におさまる献立ができました" : "予算超過のため、安い候補へ調整しました"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-ink-soft)]">
              {summary.withinBudget ? "1日ごとの金額を確認しながら、そのまま買い物リストへ進めます。" : "総額が予算を超えています。条件を見直すか、予算を少し上げると候補が広がります。"}
            </p>
            <div className="mt-4 inline-flex rounded-[1.35rem] bg-[rgba(255,255,255,0.72)] px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
                  {summary.withinBudget ? "節約できた金額" : "あと必要な予算"}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                  {savingsLabel}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="secondary-button !min-h-[46px] !px-5 !text-sm" href="/planner">条件を修正する</Link>
            <Link className="primary-button !min-h-[46px] !px-5 !text-sm" href="/shopping">買い物リストへ</Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 xl:grid-cols-4 sm:px-7">
        <div className="rounded-[1.4rem] bg-[rgba(241,232,220,0.72)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">予算</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{formatCurrency(summary.budget)}</p>
        </div>
        <div className="rounded-[1.4rem] bg-[rgba(230,237,241,0.85)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">総額</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{formatCurrency(summary.totalEstimatedCost)}</p>
        </div>
        <div className="rounded-[1.4rem] bg-[rgba(255,255,255,0.82)] px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">平均単価</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{formatCurrency(summary.averageDailyCost)}</p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{dayCount}日で割った1日あたり</p>
        </div>
        <div className={`rounded-[1.4rem] px-4 py-4 ${summary.withinBudget ? "bg-[var(--color-success-bg)]" : "bg-[var(--color-danger-bg)]"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">差額</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
            {summary.withinBudget ? "+" : "-"}
            {savingsLabel}
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{summary.withinBudget ? "予算内" : "予算オーバー"}</p>
        </div>
      </div>

      {summary.warnings.length > 0 ? (
        <div className="px-5 pb-5 sm:px-7 sm:pb-7">
          <div className="rounded-[1.4rem] border border-[rgba(201,109,70,0.2)] bg-[rgba(248,236,232,0.84)] px-4 py-4 text-sm leading-7 text-[var(--color-ink)]">
            {summary.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
