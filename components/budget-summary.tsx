import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { PlanSummary } from "@/types";

export function BudgetSummary({
  summary,
  dayCount,
  mode,
}: {
  summary: PlanSummary;
  dayCount: number;
  mode: "results" | "shopping";
}) {
  const savingsLabel = formatCurrency(Math.abs(summary.difference));

  return (
    <section className="card-surface overflow-hidden">
      <div className={`px-5 py-5 sm:px-7 ${summary.withinBudget ? "bg-[linear-gradient(135deg,rgba(237,243,236,0.95),rgba(255,252,248,0.82))]" : "bg-[linear-gradient(135deg,rgba(248,236,232,0.95),rgba(255,252,248,0.82))]"}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Budget</p>
            <h2 className="mt-2 text-2xl font-heading tracking-[-0.03em] text-[var(--color-ink)]">
              {summary.withinBudget ? "予算内です" : "予算オーバーです"}
            </h2>
          </div>
          <span className={`rounded-[var(--radius-pill)] px-4 py-2 text-sm font-semibold ${summary.withinBudget ? "bg-[var(--color-success-bg)] text-[var(--color-ink)]" : "bg-[var(--color-danger-bg)] text-[var(--color-ink)]"}`}>
            合計 {formatCurrency(summary.totalEstimatedCost)}
          </span>
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

      {mode === "shopping" ? (
        <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2 sm:px-7 sm:pb-7">
          <Link className="primary-button w-full" href="/results">献立を見る</Link>
          <Link className="secondary-button w-full" href="/planner">条件を変える</Link>
        </div>
      ) : null}

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
