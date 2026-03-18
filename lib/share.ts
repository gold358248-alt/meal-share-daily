import { PlanResult, ShoppingListItem } from "@/types";
import { formatCurrency, formatQuantity, groupShoppingItems } from "@/lib/utils";

export function buildPlanSummaryText(plan: PlanResult) {
  const lines = plan.days.map((day) => {
    const dishes = day.dishes.map((dish) => dish.name).join(" / ");
    return `${day.title}: ${dishes}`;
  });

  return [
    `【${plan.input.days}日分の献立プラン】`,
    ...lines,
    `総額目安: ${formatCurrency(plan.summary.totalEstimatedCost)}`,
  ].join("\n");
}

export function buildShoppingShareText(
  plan: PlanResult,
  items: ShoppingListItem[],
  options?: { includeMenu?: boolean; heading?: string },
) {
  const groups = groupShoppingItems(items);
  const lines = groups.flatMap((group) => [
    `■ ${group.category}`,
    ...group.items.map(
      (item) =>
        `・${item.name} ${formatQuantity(item.shortageQuantity)}${item.unit} (${formatCurrency(item.estimatedPrice)})`,
    ),
  ]);

  const sections = [options?.heading ?? `【${plan.input.days}日分の献立用 買い物リスト】`];

  if (options?.includeMenu) {
    sections.push(buildPlanSummaryText(plan));
  }

  sections.push(...lines);
  sections.push(`合計目安: ${formatCurrency(items.reduce((sum, item) => sum + item.estimatedPrice, 0))}`);

  return sections.join("\n");
}
