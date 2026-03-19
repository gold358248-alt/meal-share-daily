"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { trackEvent, useTrackView } from "@/lib/analytics";
import { loadPlannerDraft, saveLatestPlan, savePlannerDraft } from "@/lib/storage";
import { splitTags } from "@/lib/utils";
import { PlanResult, PlannerInput } from "@/types";

type PlannerMode = "easy" | "detailed";
type PlannerStep = "mode" | "basics" | "preferences" | "ingredients" | "review";

type PlannerFormState = {
  mode: PlannerMode | "";
  days: number | null;
  people: number | null;
  budgetChoice: string;
  customBudget: string;
  preferences: string[];
  dislikes: string[];
  customDislikes: string;
  allergies: string[];
  customAllergies: string;
  pantry: string[];
  customPantry: string;
};

const DAY_OPTIONS = [1, 2, 3, 5] as const;
const PEOPLE_OPTIONS = [1, 2, 3, 4] as const;
const BUDGET_OPTIONS = ["2000", "3000", "5000", "8000", "custom"] as const;

const PREFERENCE_OPTIONS = [
  "節約",
  "時短",
  "和食",
  "洋食",
  "中華",
  "子ども向け",
  "大人向け",
  "野菜多め",
  "ヘルシー",
  "がっつり",
  "リッチ",
  "ごはんが進む",
  "家庭的",
  "定番",
  "さっぱり",
  "こってり",
  "お酒に合う",
] as const;

const DISLIKE_OPTIONS = ["きのこ", "ピーマン", "セロリ", "魚", "辛いもの"] as const;
const ALLERGY_OPTIONS = ["卵", "乳", "小麦", "えび", "かに"] as const;
const PANTRY_OPTIONS = ["米", "卵", "玉ねぎ", "豆腐", "じゃがいも", "にんじん", "みそ", "冷凍うどん"] as const;

const initialFormState: PlannerFormState = {
  mode: "",
  days: 3,
  people: 3,
  budgetChoice: "5000",
  customBudget: "",
  preferences: ["和食", "家庭的", "野菜多め"],
  dislikes: [],
  customDislikes: "",
  allergies: [],
  customAllergies: "",
  pantry: ["米", "玉ねぎ", "みそ"],
  customPantry: "",
};

function ChipButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`min-h-[48px] rounded-[var(--radius-control)] border px-4 text-sm font-semibold transition ${
        active
          ? "border-transparent bg-[var(--color-ink)] text-white shadow-[0_14px_24px_-22px_rgba(35,50,68,0.9)]"
          : "border-[var(--color-border)] bg-[rgba(255,252,248,0.82)] text-[var(--color-ink-soft)]"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function SectionTitle({ title, body }: { title: string; body?: string }) {
  return (
    <div>
      <h1 className="text-[1.7rem] font-heading tracking-[-0.03em] text-[var(--color-ink)] sm:text-[2rem]">
        {title}
      </h1>
      {body ? (
        <p className="mt-2 text-sm leading-7 text-[var(--color-ink-soft)]">
          {body}
        </p>
      ) : null}
    </div>
  );
}

function toggleArrayValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function PlannerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<PlannerFormState>(initialFormState);
  const [step, setStep] = useState<PlannerStep>("mode");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [sampleMode, setSampleMode] = useState(false);

  useTrackView("planner_start", {
    source: searchParams.get("sample") === "1" ? "sample" : "direct",
  });

  useEffect(() => {
    const modeParam = searchParams.get("mode");

    if (searchParams.get("sample") === "1") {
      setForm({
        ...initialFormState,
        mode: "easy",
      });
      setSampleMode(true);
      setStep("review");
      setDraftReady(true);
      return;
    }

    if (modeParam === "easy" || modeParam === "detailed") {
      setForm((current) => ({
        ...current,
        mode: modeParam,
      }));
      setSampleMode(false);
      setStep(modeParam === "easy" ? "preferences" : "basics");
      setDraftReady(true);
      return;
    }

    const draft = loadPlannerDraft();
    if (draft) {
      const merged = { ...initialFormState, ...draft } as PlannerFormState;
      setForm(merged);
      setStep(merged.mode ? "basics" : "mode");
    }
    setSampleMode(false);
    setDraftReady(true);
  }, [searchParams]);

  useEffect(() => {
    if (!draftReady) return;
    savePlannerDraft(form as unknown as Record<string, unknown>);
  }, [draftReady, form]);

  const resolvedBudget = form.budgetChoice === "custom"
    ? Number(form.customBudget)
    : Number(form.budgetChoice);

  const canProceed = useMemo(() => {
    if (step === "mode") return Boolean(form.mode);
    if (step === "basics") return Boolean(form.days && form.people && resolvedBudget > 0);
    if (step === "preferences") return form.preferences.length > 0;
    return true;
  }, [form.days, form.mode, form.people, form.preferences.length, resolvedBudget, step]);

  function updateField<K extends keyof PlannerFormState>(key: K, value: PlannerFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function nextStep() {
    setError("");
    if (!canProceed) return;

    if (step === "mode") setStep("basics");
    if (step === "basics") setStep("preferences");
    if (step === "preferences") setStep(form.mode === "easy" ? "review" : "ingredients");
    if (step === "ingredients") setStep("review");
  }

  function previousStep() {
    setError("");
    if (step === "review") setStep(form.mode === "easy" ? "preferences" : "ingredients");
    if (step === "ingredients") setStep("preferences");
    if (step === "preferences") setStep("basics");
    if (step === "basics") setStep("mode");
  }

  async function handleSubmit() {
    setError("");

    const payload: PlannerInput = {
      budget: resolvedBudget,
      people: form.people ?? 3,
      days: form.days ?? 3,
      preferences: form.preferences,
      dislikes: [...form.dislikes, ...splitTags(form.customDislikes)],
      allergies: [...form.allergies, ...splitTags(form.customAllergies)],
      pantry: [...form.pantry, ...splitTags(form.customPantry)].join("\n"),
    };

    if (payload.budget <= 0 || payload.people <= 0 || payload.days <= 0) {
      setError("日数・人数・予算を選んでください。");
      return;
    }

    if (payload.preferences.length === 0) {
      setError("食べたい気分をひとつ以上選んでください。");
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
      <div className="mx-auto max-w-3xl">
        <div className="card-surface overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Meal Setup</p>
                <p className="mt-2 text-sm font-semibold text-[var(--color-ink-soft)]">
                  {step === "mode" && "進め方を選ぶ"}
                  {step === "basics" && "基本条件"}
                  {step === "preferences" && "食べたい気分"}
                  {step === "ingredients" && "避けたいもの / 在庫"}
                  {step === "review" && "最終確認"}
                </p>
              </div>
              <Link className="secondary-button !min-h-[42px] !px-4 !text-sm" href="/">
                ホームへ
              </Link>
            </div>
            {sampleMode ? (
              <p className="mt-3 text-xs leading-6 text-[var(--color-ink-muted)]">
                サンプル条件を読み込みました。このまま献立を作ることも、条件を変えることもできます。
              </p>
            ) : null}
          </div>

          <div className="space-y-6 px-5 py-6 sm:px-7">
            {step === "mode" ? (
              <section className="space-y-4">
                <SectionTitle title="どんなふうに決めますか？" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    className={`rounded-[1.5rem] border p-5 text-left ${form.mode === "easy" ? "border-transparent bg-[var(--color-ink)] text-white" : "border-[var(--color-border)] bg-[rgba(255,252,248,0.84)] text-[var(--color-ink)]"}`}
                    onClick={() => updateField("mode", "easy")}
                    type="button"
                  >
                    <p className="text-lg font-semibold">かんたんに選ぶ</p>
                    <p className={`mt-2 text-sm leading-7 ${form.mode === "easy" ? "text-white/80" : "text-[var(--color-ink-soft)]"}`}>
                      タップ中心で、今日食べたい方向だけをすばやく決めます。
                    </p>
                  </button>
                  <button
                    className={`rounded-[1.5rem] border p-5 text-left ${form.mode === "detailed" ? "border-transparent bg-[var(--color-ink)] text-white" : "border-[var(--color-border)] bg-[rgba(255,252,248,0.84)] text-[var(--color-ink)]"}`}
                    onClick={() => updateField("mode", "detailed")}
                    type="button"
                  >
                    <p className="text-lg font-semibold">こだわって入力する</p>
                    <p className={`mt-2 text-sm leading-7 ${form.mode === "detailed" ? "text-white/80" : "text-[var(--color-ink-soft)]"}`}>
                      気になる苦手食材や在庫を細かく足して、より自分好みに寄せます。
                    </p>
                  </button>
                </div>
              </section>
            ) : null}

            {step === "basics" ? (
              <section className="space-y-5">
                <SectionTitle title="何日分つくる？" />
                <div className="space-y-5">
                  <div>
                    <p className="mb-3 text-sm font-semibold text-[var(--color-ink)]">日数</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {DAY_OPTIONS.map((day) => (
                        <ChipButton active={form.days === day} key={day} onClick={() => updateField("days", day)}>
                          {day}日
                        </ChipButton>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold text-[var(--color-ink)]">人数</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {PEOPLE_OPTIONS.map((people) => (
                        <ChipButton active={form.people === people} key={people} onClick={() => updateField("people", people)}>
                          {people === 4 ? "4人以上" : `${people}人`}
                        </ChipButton>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold text-[var(--color-ink)]">予算</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {BUDGET_OPTIONS.map((budget) => (
                        <ChipButton active={form.budgetChoice === budget} key={budget} onClick={() => updateField("budgetChoice", budget)}>
                          {budget === "custom" ? "自分で入力" : `${budget}円`}
                        </ChipButton>
                      ))}
                    </div>
                    {form.budgetChoice === "custom" ? (
                      <div className="mt-3 rounded-[1.4rem] border border-[var(--color-border)] bg-[rgba(255,252,248,0.82)] p-4">
                        <label className="field-label">予算を入力</label>
                        <input
                          className="field-base"
                          inputMode="numeric"
                          onChange={(event) => updateField("customBudget", event.target.value)}
                          placeholder="例: 4500"
                          type="number"
                          value={form.customBudget}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {step === "preferences" ? (
              <section className="space-y-5">
                <SectionTitle title="今の気分に近いものを選ぶ" />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PREFERENCE_OPTIONS.map((option) => (
                    <ChipButton
                      active={form.preferences.includes(option)}
                      key={option}
                      onClick={() => updateField("preferences", toggleArrayValue(form.preferences, option))}
                    >
                      {option}
                    </ChipButton>
                  ))}
                </div>
              </section>
            ) : null}

            {step === "ingredients" ? (
              <section className="space-y-5">
                <SectionTitle title="避けたいものと在庫を選ぶ" />
                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(255,252,248,0.84)] p-4">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">苦手食材</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {DISLIKE_OPTIONS.map((option) => (
                        <ChipButton
                          active={form.dislikes.includes(option)}
                          key={option}
                          onClick={() => updateField("dislikes", toggleArrayValue(form.dislikes, option))}
                        >
                          {option}
                        </ChipButton>
                      ))}
                    </div>
                    {form.mode === "detailed" ? (
                      <textarea
                        className="field-base mt-3 min-h-24 resize-y"
                        onChange={(event) => updateField("customDislikes", event.target.value)}
                        placeholder="その他を追加"
                        value={form.customDislikes}
                      />
                    ) : null}
                  </div>

                  <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(255,252,248,0.84)] p-4">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">アレルギー</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {ALLERGY_OPTIONS.map((option) => (
                        <ChipButton
                          active={form.allergies.includes(option)}
                          key={option}
                          onClick={() => updateField("allergies", toggleArrayValue(form.allergies, option))}
                        >
                          {option}
                        </ChipButton>
                      ))}
                    </div>
                    {form.mode === "detailed" ? (
                      <textarea
                        className="field-base mt-3 min-h-24 resize-y"
                        onChange={(event) => updateField("customAllergies", event.target.value)}
                        placeholder="その他を追加"
                        value={form.customAllergies}
                      />
                    ) : null}
                  </div>

                  <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[rgba(255,252,248,0.84)] p-4">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">家にある食材</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {PANTRY_OPTIONS.map((option) => (
                        <ChipButton
                          active={form.pantry.includes(option)}
                          key={option}
                          onClick={() => updateField("pantry", toggleArrayValue(form.pantry, option))}
                        >
                          {option}
                        </ChipButton>
                      ))}
                    </div>
                    <textarea
                      className="field-base mt-3 min-h-24 resize-y"
                      onChange={(event) => updateField("customPantry", event.target.value)}
                      placeholder={form.mode === "detailed" ? "その他を追加（例: 豆苗、ツナ缶、ヨーグルト）" : "その他があれば追加"}
                      value={form.customPantry}
                    />
                  </div>
                </div>
              </section>
            ) : null}

            {step === "review" ? (
              <section className="space-y-5">
                <SectionTitle title="この条件でつくる" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] bg-[rgba(241,232,220,0.7)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">日数 / 人数 / 予算</p>
                    <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">
                      {form.days ?? 3}日 / {form.people === 4 ? "4人以上" : `${form.people ?? 3}人`} / {resolvedBudget.toLocaleString("ja-JP")}円
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] bg-[rgba(255,252,248,0.84)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">食べたい気分</p>
                    <p className="mt-2 text-sm font-semibold leading-7 text-[var(--color-ink)]">
                      {form.preferences.join(" / ")}
                    </p>
                  </div>
                  {(form.dislikes.length > 0 || form.customDislikes) ? (
                    <div className="rounded-[1.4rem] bg-[rgba(255,252,248,0.84)] px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">苦手食材</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--color-ink)]">
                        {[...form.dislikes, ...splitTags(form.customDislikes)].join(" / ")}
                      </p>
                    </div>
                  ) : null}
                  {(form.allergies.length > 0 || form.customAllergies) ? (
                    <div className="rounded-[1.4rem] bg-[rgba(255,252,248,0.84)] px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">アレルギー</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--color-ink)]">
                        {[...form.allergies, ...splitTags(form.customAllergies)].join(" / ")}
                      </p>
                    </div>
                  ) : null}
                  {(form.pantry.length > 0 || form.customPantry) ? (
                    <div className="rounded-[1.4rem] bg-[rgba(255,252,248,0.84)] px-4 py-4 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">家にある食材</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--color-ink)]">
                        {[...form.pantry, ...splitTags(form.customPantry)].join(" / ")}
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {error ? (
              <p className="rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
                {error}
              </p>
            ) : null}

            <div className="flex gap-3">
              {step !== "mode" && !(searchParams.get("mode") && step === "basics") ? (
                <button className="secondary-button flex-1" onClick={previousStep} type="button">
                  戻る
                </button>
              ) : null}
              {step !== "review" ? (
                <button className="primary-button flex-1" disabled={!canProceed} onClick={nextStep} type="button">
                  次へ進む
                </button>
              ) : (
                <button
                  className="primary-button flex-1 !min-h-[56px] !text-base"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  type="button"
                >
                  {isSubmitting ? "献立をつくっています..." : "この条件で作る"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
