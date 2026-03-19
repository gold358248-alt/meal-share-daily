import { formatCurrency, formatQuantity, formatSlot } from "@/lib/utils";
import { DayPlan, PlannedDish } from "@/types";

const slotStyle: Record<PlannedDish["slot"], { badge: string; border: string; bg: string }> = {
  main: {
    badge: "bg-[var(--color-clay)] text-white",
    border: "border-[rgba(201,109,70,0.16)]",
    bg: "bg-[rgba(201,109,70,0.05)]",
  },
  side: {
    badge: "bg-[var(--color-ink)] text-white",
    border: "border-[rgba(35,50,68,0.12)]",
    bg: "bg-[rgba(35,50,68,0.04)]",
  },
  soup: {
    badge: "bg-[var(--color-plum)] text-white",
    border: "border-[rgba(133,112,122,0.14)]",
    bg: "bg-[rgba(133,112,122,0.05)]",
  },
};

const highlightTagMap: Record<string, string> = {
  時短: "時短",
  子ども向け: "子ども向け",
  野菜中心料理: "野菜多め",
  定番: "定番",
  作り置き: "作り置き",
  節約: "節約",
};

function getHighlightTags(tags: string[]) {
  return tags.map((tag) => highlightTagMap[tag]).filter(Boolean).slice(0, 3);
}

export function DayPlanCard({ day, featured = false }: { day: DayPlan; featured?: boolean }) {
  const mainDish = day.dishes.find((dish) => dish.slot === "main");
  const sideDishes = day.dishes.filter((dish) => dish.slot === "side");
  const soupDish = day.dishes.find((dish) => dish.slot === "soup");
  const mainTags = mainDish ? getHighlightTags(mainDish.tags) : [];

  return (
    <article className={`card-surface overflow-hidden ${featured ? "ring-1 ring-[rgba(201,109,70,0.18)]" : ""}`}>
      <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">{featured ? "Today's Pick" : `Day ${day.day}`}</p>
            <h3 className="mt-2 text-2xl font-heading tracking-[-0.03em] text-[var(--color-ink)]">{day.title}</h3>
            <p className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--color-ink)]">{mainDish?.name}</p>
            {mainDish?.recommendationReason ? (
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">{mainDish.recommendationReason}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-[var(--radius-pill)] bg-[rgba(241,232,220,0.72)] px-4 py-2 font-semibold text-[var(--color-ink)]">{formatCurrency(day.totalCost)}</span>
            <span className="rounded-[var(--radius-pill)] bg-[rgba(230,237,241,0.82)] px-4 py-2 font-semibold text-[var(--color-ink)]">調理 {day.totalCookTimeMinutes}分</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-5 py-5 sm:px-6">
        {mainDish ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-[1.25rem] bg-[rgba(255,252,248,0.84)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">気分ラベル</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {mainDish.moodLabels.slice(0, 2).map((label) => (
                  <span className="rounded-[var(--radius-pill)] bg-[rgba(201,109,70,0.12)] px-3 py-1 text-xs font-semibold text-[var(--color-clay-deep)]" key={label}>
                    {label}
                  </span>
                ))}
                {mainTags.filter((tag) => !mainDish.moodLabels.includes(tag)).slice(0, 1).map((tag) => (
                  <span className="rounded-[var(--radius-pill)] bg-[rgba(35,50,68,0.08)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)]" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-[1.25rem] bg-[rgba(255,252,248,0.84)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">満足感</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">{mainDish.satisfactionLabel}</p>
            </div>
            <div className="rounded-[1.25rem] bg-[rgba(255,252,248,0.84)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">手軽さ</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">{mainDish.easeLabel}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.4rem] bg-[rgba(255,252,248,0.84)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">主菜</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-ink)]">{mainDish?.name ?? "未設定"}</p>
          </div>
          <div className="rounded-[1.4rem] bg-[rgba(255,252,248,0.84)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">副菜</p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">{sideDishes.length}品</p>
          </div>
          <div className="rounded-[1.4rem] bg-[rgba(255,252,248,0.84)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">汁物</p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">{soupDish ? "あり" : "なし"}</p>
          </div>
        </div>

        {day.dishes.map((dish) => {
          const tone = slotStyle[dish.slot];
          const tags = getHighlightTags(dish.tags);

          return (
            <details className={`rounded-[1.5rem] border p-4 ${tone.border} ${tone.bg}`} key={`${day.day}-${dish.recipeId}`}>
              <summary className="flex cursor-pointer items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}>{formatSlot(dish.slot)}</span>
                  <h4 className="mt-3 text-base font-semibold text-[var(--color-ink)]">{dish.name}</h4>
                </div>
                <div className="rounded-[1rem] bg-white/85 px-3 py-2 text-right text-xs text-[var(--color-ink-muted)]">
                  <p>{dish.cookTimeMinutes}分</p>
                  <p className="mt-1 font-semibold text-[var(--color-ink)]">{formatCurrency(dish.estimatedCost)}</p>
                </div>
              </summary>

              <div className="mt-4 space-y-3">
                {tags.length > 0 && dish.slot !== "main" ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span className="rounded-[var(--radius-pill)] bg-white/88 px-3 py-1 text-xs font-semibold text-[var(--color-ink-soft)]" key={`${dish.recipeId}-${tag}`}>{tag}</span>
                    ))}
                  </div>
                ) : null}
                <p className="text-sm leading-6 text-[var(--color-ink-soft)]">{dish.description}</p>
                <div className="rounded-[1.1rem] border border-[rgba(35,50,68,0.08)] bg-[rgba(255,255,255,0.76)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">必要食材</p>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-[var(--color-ink-soft)]">
                    {dish.ingredients.map((ingredient) => (
                      <li key={`${dish.recipeId}-${ingredient.id}`}>
                        {ingredient.name} {formatQuantity(ingredient.quantity)}
                        {ingredient.unit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[1.1rem] border border-[rgba(35,50,68,0.08)] bg-[rgba(255,255,255,0.76)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">手順</p>
                  <ol className="mt-2 space-y-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                    {dish.steps.map((step, index) => (
                      <li key={`${dish.recipeId}-${index + 1}`}>{index + 1}. {step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </article>
  );
}
