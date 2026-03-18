"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BudgetSummary } from "@/components/budget-summary";
import { DayPlanCard } from "@/components/day-plan-card";
import { FeedbackToast } from "@/components/feedback-toast";
import { ShoppingListTable } from "@/components/shopping-list-table";
import { trackEvent } from "@/lib/analytics";
import { loadLatestPlan, saveLatestPlan, savePlanEntry } from "@/lib/storage";
import { PlanResult, PlannerInput } from "@/types";

export function ResultShell({ mode }: { mode: "results" | "shopping" }) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanResult | null | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastTone, setToastTone] = useState<"default" | "success" | "warning">("default");

  useEffect(() => {
    setPlan(loadLatestPlan());
  }, []);

  useEffect(() => {
    if (plan === null) {
      router.replace("/planner");
    }
  }, [plan, router]);

  useEffect(() => {
    if (mode === "shopping" && plan) {
      trackEvent("shopping_view", {
        itemCount: plan.shoppingList.length,
        totalEstimatedCost: plan.summary.totalEstimatedCost,
      });
    }
  }, [mode, plan]);

  const showToast = useCallback((message: string, tone: "default" | "success" | "warning" = "default") => {
    setToastMessage(message);
    setToastTone(tone);
  }, []);

  async function regenerate(strategy: PlannerInput["strategy"]) {
    if (!plan || isRefreshing) return;

    setIsRefreshing(true);
    showToast(
      strategy === "budget"
        ? "予算重視で献立を再調整しています。"
        : strategy === "quick"
          ? "時短寄りに献立を組み直しています。"
          : "好みを強めに反映して組み直しています。",
      "default",
    );

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...plan.input, strategy }),
      });

      const data = (await response.json()) as PlanResult | { error?: string };

      if (!response.ok || !("days" in data)) {
        const message = "error" in data ? data.error : undefined;
        throw new Error(message ?? "再生成に失敗しました。");
      }

      saveLatestPlan(data);
      setPlan(data);
      trackEvent("plan_regenerated", {
        strategy,
        totalEstimatedCost: data.summary.totalEstimatedCost,
        withinBudget: data.summary.withinBudget,
      });
      showToast("献立を更新しました。", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "献立の更新に失敗しました。",
        "warning",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleSavePlan() {
    if (!plan) return;
    savePlanEntry(plan);
    trackEvent("plan_saved", {
      totalEstimatedCost: plan.summary.totalEstimatedCost,
      days: plan.days.length,
    });
    showToast("この献立を保存しました。ホームから見返せます。", "success");
  }

  if (plan === undefined) {
    return (
      <section className="app-shell space-y-4">
        <div className="card-surface h-48 animate-pulse bg-white/60" />
        <div className="card-surface h-36 animate-pulse bg-white/60" />
        <div className="card-surface h-72 animate-pulse bg-white/60" />
      </section>
    );
  }

  if (!plan) {
    return (
      <section className="app-shell">
        <div className="card-surface mx-auto max-w-2xl px-6 py-10 text-center sm:px-8">
          <p className="eyebrow">Redirecting</p>
          <h1 className="section-title mt-4">条件入力ページへ移動しています</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--color-ink-soft)]">
            献立結果と買い物リストは、先に献立を生成してから利用できます。
          </p>
          <div className="mt-6">
            <Link className="primary-button" href="/planner">条件入力へ進む</Link>
          </div>
        </div>
      </section>
    );
  }

  const generatedLabel = new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(plan.generatedAt));

  return (
    <>
      <main className="app-shell space-y-5 md:space-y-6">
        <header className={`card-surface animate-rise overflow-hidden transition-opacity ${isRefreshing ? "opacity-80" : "opacity-100"}`}>
          <div className="bg-[linear-gradient(135deg,rgba(241,232,220,0.62),rgba(255,252,248,0.8)_42%,rgba(35,50,68,0.06))] px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow">{mode === "results" ? "Meal Plan Ready" : "Shopping List Ready"}</p>
                <h1 className="section-title mt-3">
                  {mode === "results" ? `${plan.input.days}日分の献立ができました` : "このまま買い物に使える形です"}
                </h1>
                <p className="mt-3 text-sm leading-7 text-[var(--color-ink-soft)]">
                  {mode === "results" ? "日ごとの献立と費用を確認して、必要なら条件を調整できます。" : "カテゴリ別に不足食材を整理し、チェック・コピー・共有まで行えます。"}
                </p>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <span className="rounded-[var(--radius-pill)] bg-[rgba(241,232,220,0.72)] px-4 py-3 text-center font-semibold text-[var(--color-ink)]">{plan.input.people}人 / {plan.input.days}日</span>
                <span className="rounded-[var(--radius-pill)] bg-[rgba(255,255,255,0.78)] px-4 py-3 text-center font-semibold text-[var(--color-ink-soft)]">更新 {generatedLabel}</span>
              </div>
            </div>

            <nav className="mt-5 flex flex-wrap gap-2">
              <Link className={`inline-flex min-h-[46px] items-center justify-center rounded-[var(--radius-control)] px-5 text-sm font-semibold ${mode === "results" ? "bg-[var(--color-ink)] text-white" : "border border-[var(--color-border)] bg-[rgba(255,255,255,0.76)] text-[var(--color-ink-soft)]"}`} href="/results">献立表示</Link>
              <Link className={`inline-flex min-h-[46px] items-center justify-center rounded-[var(--radius-control)] px-5 text-sm font-semibold ${mode === "shopping" ? "bg-[var(--color-ink)] text-white" : "border border-[var(--color-border)] bg-[rgba(255,255,255,0.76)] text-[var(--color-ink-soft)]"}`} href="/shopping">買い物リスト</Link>
              <Link className="inline-flex min-h-[46px] items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[rgba(255,255,255,0.76)] px-5 text-sm font-semibold text-[var(--color-ink-soft)]" href="/planner">条件を修正する</Link>
            </nav>

            {mode === "results" ? (
              <div className="mt-5 grid gap-3 xl:grid-cols-[0.95fr_0.95fr_1.2fr]">
                <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(255,255,255,0.72)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-clay)]">次のアクション</p>
                  <h2 className="mt-2 text-lg font-semibold text-[var(--color-ink)]">買い物リストへ進む</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-ink-soft)]">不足食材だけを整理した画面へ、そのまま進めます。</p>
                  <Link className="primary-button mt-4 w-full !min-h-[48px] !text-sm" href="/shopping">買い物リストへ進む</Link>
                </section>

                <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(255,255,255,0.72)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-clay)]">保存</p>
                  <h2 className="mt-2 text-lg font-semibold text-[var(--color-ink)]">この献立を保存</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-ink-soft)]">気に入ったプランはホームからすぐ見返せます。</p>
                  <button
                    className="secondary-button mt-4 w-full !min-h-[48px] !text-sm"
                    onClick={handleSavePlan}
                    type="button"
                  >
                    この献立を保存
                  </button>
                </section>

                <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(255,255,255,0.72)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-clay)]">再生成</p>
                  <h2 className="mt-2 text-lg font-semibold text-[var(--color-ink)]">条件を微調整して再生成</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-ink-soft)]">入力条件は引き継いだまま、方向性だけ変えて組み直せます。</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <button
                      className="secondary-button !min-h-[48px] !justify-center !px-4 !text-sm"
                      disabled={isRefreshing}
                      onClick={() => regenerate("budget")}
                      type="button"
                    >
                      もっと安く
                    </button>
                    <button
                      className="secondary-button !min-h-[48px] !justify-center !px-4 !text-sm"
                      disabled={isRefreshing}
                      onClick={() => regenerate("quick")}
                      type="button"
                    >
                      時短にする
                    </button>
                    <button
                      className="secondary-button !min-h-[48px] !justify-center !px-4 !text-sm"
                      disabled={isRefreshing}
                      onClick={() => regenerate("preference")}
                      type="button"
                    >
                      好みを強める
                    </button>
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </header>

        <BudgetSummary dayCount={plan.days.length} summary={plan.summary} />

        {mode === "results" ? (
          <section className="space-y-4">
            {plan.days.map((day) => (
              <DayPlanCard day={day} key={day.day} />
            ))}
          </section>
        ) : (
          <ShoppingListTable plan={plan} />
        )}
      </main>
      <FeedbackToast message={toastMessage} onClose={() => setToastMessage("")} tone={toastTone} />
    </>
  );
}
