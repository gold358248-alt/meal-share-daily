"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { trackEvent, useTrackView } from "@/lib/analytics";
import { loadPlannerDraft, saveLatestPlan, savePlannerDraft } from "@/lib/storage";
import { splitTags } from "@/lib/utils";
import { PlanResult, PlannerInput } from "@/types";

const initialState = {
  budget: "4800",
  people: "3",
  days: "3",
  preferences: "和食、魚多め、20分以内",
  dislikes: "",
  allergies: "",
  pantry: "玉ねぎ 2個\n米 3合\nみそ",
};

function FieldMeta({
  title,
  tone = "required",
  help,
}: {
  title: string;
  tone?: "required" | "optional";
  help: string;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2">
        <span className="field-label mb-0">{title}</span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone === "required" ? "bg-[var(--color-sand)] text-[var(--color-ink)]" : "bg-stone-100 text-[var(--color-ink-soft)]"}`}>
          {tone === "required" ? "必須" : "任意"}
        </span>
      </div>
      <p className="mt-1 text-xs leading-5 text-[var(--color-ink-muted)]">{help}</p>
    </div>
  );
}

export function PlannerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [sampleMode, setSampleMode] = useState(false);

  useTrackView("planner_start", {
    source: searchParams.get("sample") === "1" ? "sample" : "direct",
  });

  useEffect(() => {
    if (searchParams.get("sample") === "1") {
      setForm(initialState);
      setSampleMode(true);
      setDraftRestored(false);
      setDraftReady(true);
      return;
    }

    setSampleMode(false);
    const draft = loadPlannerDraft();
    if (draft) {
      setForm((current) => ({ ...current, ...draft }));
      setDraftRestored(true);
    }
    setDraftReady(true);
  }, [searchParams]);

  useEffect(() => {
    if (!draftReady) return;
    savePlannerDraft(form);
  }, [draftReady, form]);

  function updateField(key: keyof typeof initialState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const payload: PlannerInput = {
      budget: Number(form.budget),
      people: Number(form.people),
      days: Number(form.days),
      preferences: splitTags(form.preferences),
      dislikes: splitTags(form.dislikes),
      allergies: splitTags(form.allergies),
      pantry: form.pantry,
    };

    if (payload.budget <= 0 || payload.people <= 0 || payload.days <= 0) {
      setError("予算・人数・日数は1以上で入力してください。");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as PlanResult | { error?: string };

      if (!response.ok || !("days" in data)) {
        const message = "error" in data ? data.error : undefined;
        throw new Error(message ?? "献立の生成に失敗しました。");
      }

      saveLatestPlan(data);
      trackEvent("plan_generated", {
        days: data.days.length,
        totalEstimatedCost: data.summary.totalEstimatedCost,
        withinBudget: data.summary.withinBudget,
      });
      router.push("/results");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "献立の生成に失敗しました。時間を空けて再度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="app-shell">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.06fr)_340px]">
        <div className="card-surface overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-7">
            <p className="eyebrow">Condition Input</p>
            <h1 className="section-title mt-3">家族向けの条件を入れるだけ</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--color-ink-soft)] sm:text-base">
              入力はスマホ向けに最適化しています。迷いやすい項目には短い補助説明を付けているので、
              初めての人でもそのまま試せます。
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="secondary-button !min-h-[42px] !px-4 !text-sm" onClick={() => setForm(initialState)} type="button">
                サンプル入力を反映
              </button>
              <Link className="secondary-button !min-h-[42px] !px-4 !text-sm" href="/">
                トップへ戻る
              </Link>
            </div>
            {draftRestored ? (
              <p className="mt-3 text-xs leading-6 text-[var(--color-ink-muted)]">
                前回の入力内容を自動で復元しました。必要に応じて調整してください。
              </p>
            ) : null}
            {sampleMode ? (
              <p className="mt-3 text-xs leading-6 text-[var(--color-ink-muted)]">
                サンプル条件を読み込みました。そのまま生成して、使い勝手をすぐ試せます。
              </p>
            ) : null}
          </div>

          <form className="space-y-6 px-5 py-6 sm:px-7" onSubmit={handleSubmit}>
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">基本条件</p>
                <p className="mt-1 text-xs leading-6 text-[var(--color-ink-muted)]">ここだけでも入力すれば、まず試せます。</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { key: "budget", title: "予算", help: "食材費の目安です", unit: "円", min: 1000 },
                  { key: "people", title: "人数", help: "食べる人数", unit: "人", min: 1 },
                  { key: "days", title: "日数", help: "まとめて考えたい日数", unit: "日", min: 1, max: 7 },
                ].map((field) => (
                  <label className="rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(255,252,248,0.82)] p-4" key={field.key}>
                    <FieldMeta help={field.help} title={field.title} />
                    <div className="flex items-center gap-3 rounded-[1.15rem] border border-[var(--color-border)] bg-[rgba(255,255,255,0.76)] px-4 py-3">
                      <input
                        className="w-full bg-transparent text-lg font-semibold text-[var(--color-ink)] outline-none"
                        inputMode="numeric"
                        min={field.min}
                        max={field.max}
                        onChange={(event) => updateField(field.key as keyof typeof initialState, event.target.value)}
                        required
                        type="number"
                        value={form[field.key as keyof typeof initialState]}
                      />
                      <span className="text-sm font-semibold text-[var(--color-ink-soft)]">{field.unit}</span>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section className="grid gap-4">
              <label className="rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(255,252,248,0.82)] p-4">
                <FieldMeta help="例: 和食、魚多め、子ども向け、20分以内" title="好み" />
                <textarea className="field-base min-h-28 resize-y" onChange={(event) => updateField("preferences", event.target.value)} placeholder="和食、魚多め、子ども向け、20分以内" value={form.preferences} />
              </label>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(255,252,248,0.82)] p-4">
                  <FieldMeta help="例: きのこ、セロリ" title="苦手食材" tone="optional" />
                  <textarea className="field-base min-h-24 resize-y" onChange={(event) => updateField("dislikes", event.target.value)} placeholder="きのこ、セロリ" value={form.dislikes} />
                </label>
                <label className="rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(255,252,248,0.82)] p-4">
                  <FieldMeta help="例: 卵、乳" title="アレルギー" tone="optional" />
                  <textarea className="field-base min-h-24 resize-y" onChange={(event) => updateField("allergies", event.target.value)} placeholder="卵、乳" value={form.allergies} />
                </label>
              </div>

              <label className="rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(255,252,248,0.82)] p-4">
                <FieldMeta help="1行に1食材推奨です。例: 玉ねぎ 2個 / 米 3合 / みそ" title="家にある食材" tone="optional" />
                <textarea className="field-base min-h-36 resize-y" onChange={(event) => updateField("pantry", event.target.value)} placeholder={"玉ねぎ 2個\n米 3合\nみそ"} value={form.pantry} />
                <p className="mt-2 text-xs leading-6 text-[var(--color-ink-muted)]">
                  数量なしで書いた食材は「十分にある」とみなして買い物リストから外します。
                </p>
              </label>
            </section>

            {error ? (
              <p className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">{error}</p>
            ) : null}

            <div className="rounded-[1.5rem] bg-[rgba(241,232,220,0.68)] p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">生成後にできること</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                <li>・1日ごとの金額、調理時間、主菜・副菜・汁物を確認</li>
                <li>・不足食材だけをカテゴリ別にまとめてチェック</li>
                <li>・買い物リストをコピー、または共有シートで家族に送信</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button className="primary-button w-full !min-h-[56px] !text-base disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
                {isSubmitting ? `${form.days}日分の献立を作成しています...` : `${form.days}日分の献立と買い物リストを作る`}
              </button>
              {isSubmitting ? (
                <div className="rounded-[1.4rem] border border-[rgba(35,50,68,0.08)] bg-[rgba(230,237,241,0.82)] px-4 py-3 text-sm leading-7 text-[var(--color-ink-soft)]">
                  予算に合わせて献立を調整しながら、不足食材のリストもまとめています。
                </div>
              ) : null}
            </div>
          </form>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
          <div className="card-surface p-5">
            <p className="eyebrow">Public Ready</p>
            <h2 className="mt-3 text-2xl font-heading tracking-[-0.03em] text-[var(--color-ink)]">共有しやすい設計</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--color-ink-soft)]">
              <li>・生成後の買い物リストはコピーと共有に対応</li>
              <li>・モバイルで見やすい1カラム中心のカード UI</li>
              <li>・前回の入力内容を端末内に一時保存</li>
            </ul>
          </div>
          <div className="card-surface p-5">
            <p className="eyebrow">入力のコツ</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--color-ink-soft)]">
              <li>・好みは短い単語で区切ると反映しやすくなります</li>
              <li>・家にある食材は1行に1つ書くと確認しやすいです</li>
              <li>・苦手食材とアレルギーは別欄で入れると整理しやすいです</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
