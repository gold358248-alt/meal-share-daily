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

export function DayPlanCard({ day }: { day: DayPlan }) {
  return (
    <article className="card-surface overflow-hidden">
      <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Day {day.day}</p>
            <h3 className="mt-2 text-2xl font-heading tracking-[-0.03em] text-[var(--color-ink)]">{day.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
              主菜・副菜・汁物を見やすく整理しています。必要なときだけ材料と手順を開けます。
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-[var(--radius-pill)] bg-[rgba(241,232,220,0.72)] px-4 py-2 font-semibold text-[var(--color-ink)]">{formatCurrency(day.totalCost)}</span>
            <span className="rounded-[var(--radius-pill)] bg-[rgba(230,237,241,0.82)] px-4 py-2 font-semibold text-[var(--color-ink)]">調理 {day.totalCookTimeMinutes}分</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-3">
        {day.dishes.map((dish) => {
          const tone = slotStyle[dish.slot];
          const tags = getHighlightTags(dish.tags);

          return (
            <section className={`rounded-[1.5rem] border p-4 ${tone.border} ${tone.bg}`} key={`${day.day}-${dish.recipeId}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}>{formatSlot(dish.slot)}</span>
                  <h4 className="mt-3 text-lg font-semibold text-[var(--color-ink)]">{dish.name}</h4>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">{dish.description}</p>
                </div>
                <div className="rounded-[1rem] bg-white/85 px-3 py-2 text-right text-xs text-[var(--color-ink-muted)]">
                  <p>{dish.cookTimeMinutes}分</p>
                  <p className="mt-1 font-semibold text-[var(--color-ink)]">{formatCurrency(dish.estimatedCost)}</p>
                </div>
              </div>

              {tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span className="rounded-[var(--radius-pill)] bg-white/88 px-3 py-1 text-xs font-semibold text-[var(--color-ink-soft)]" key={`${dish.recipeId}-${tag}`}>{tag}</span>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 space-y-3">
                <details className="rounded-[1.1rem] border border-[rgba(35,50,68,0.08)] bg-[rgba(255,255,255,0.76)] px-4 py-3">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-[var(--color-ink)]">
                    必要食材を見る
                    <span className="text-xs text-[var(--color-ink-muted)]">タップで開閉</span>
                  </summary>
                  <ul className="mt-3 space-y-1 text-sm leading-6 text-[var(--color-ink-soft)]">
                    {dish.ingredients.map((ingredient) => (
                      <li key={`${dish.recipeId}-${ingredient.id}`}>
                        {ingredient.name} {formatQuantity(ingredient.quantity)}
                        {ingredient.unit}
                      </li>
                    ))}
                  </ul>
                </details>

                <details className="rounded-[1.1rem] border border-[rgba(35,50,68,0.08)] bg-[rgba(255,255,255,0.76)] px-4 py-3">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-[var(--color-ink)]">
                    手順を見る
                    <span className="text-xs text-[var(--color-ink-muted)]">タップで開閉</span>
                  </summary>
                  <ol className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                    {dish.steps.map((step, index) => (
                      <li key={`${dish.recipeId}-${index + 1}`}>{index + 1}. {step}</li>
                    ))}
                  </ol>
                </details>
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}
