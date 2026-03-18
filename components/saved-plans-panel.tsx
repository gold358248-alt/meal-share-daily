"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSavedPlans, saveLatestPlan } from "@/lib/storage";
import { formatCurrency } from "@/lib/utils";
import { SavedPlanEntry } from "@/types";

export function SavedPlansPanel() {
  const router = useRouter();
  const [entries, setEntries] = useState<SavedPlanEntry[]>([]);

  useEffect(() => {
    setEntries(loadSavedPlans());
  }, []);

  if (entries.length === 0) {
    return (
      <section className="card-surface px-5 py-6 sm:px-8">
        <p className="eyebrow">Saved Plans</p>
        <h2 className="mt-3 text-3xl font-heading tracking-[-0.03em] text-[var(--color-ink)]">
          保存した献立はここにたまっていきます
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-ink-soft)]">
          気に入った献立を保存しておくと、あとからすぐ見返せます。まずは条件入力から 1 回作ってみてください。
        </p>
      </section>
    );
  }

  return (
    <section className="card-surface overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-8">
        <p className="eyebrow">Saved Plans</p>
        <h2 className="mt-3 text-3xl font-heading tracking-[-0.03em] text-[var(--color-ink)]">
          保存した献立をすぐ呼び出せます
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--color-ink-soft)]">
          直近で保存した献立を端末内に保持しています。家族との共有前に見返したいときにも便利です。
        </p>
      </div>

      <div className="grid gap-4 px-5 py-5 lg:grid-cols-3 sm:px-8">
        {entries.slice(0, 3).map((entry) => {
          const savedLabel = new Intl.DateTimeFormat("ja-JP", {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(entry.savedAt));

          return (
            <article className="animate-rise rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(255,252,248,0.86)] p-5" key={entry.id}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-clay)]">
                保存 {savedLabel}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-[var(--color-ink)]">
                {entry.plan.input.days}日分 / {entry.plan.input.people}人
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                総額 {formatCurrency(entry.plan.summary.totalEstimatedCost)} ・ 平均 {formatCurrency(entry.plan.summary.averageDailyCost)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="primary-button !min-h-[46px] !px-4 !text-sm"
                  onClick={() => {
                    saveLatestPlan(entry.plan);
                    router.push("/results");
                  }}
                  type="button"
                >
                  献立を見る
                </button>
                <button
                  className="secondary-button !min-h-[46px] !px-4 !text-sm"
                  onClick={() => {
                    saveLatestPlan(entry.plan);
                    router.push("/shopping");
                  }}
                  type="button"
                >
                  買い物を見る
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
