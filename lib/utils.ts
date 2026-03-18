import { PantryItem, ShoppingListItem } from "@/types";

export const SHOPPING_CATEGORY_ORDER = [
  "肉・魚",
  "野菜",
  "調味料",
  "卵・乳",
  "豆腐・乾物",
  "その他",
] as const;

export function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function splitTags(value: string) {
  return value
    .split(/[\n,、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parsePantryInput(value: string): PantryItem[] {
  return value
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*([^\d\s]+)?$/);

      if (!match) {
        return {
          name: line,
          quantity: null,
          unit: null,
        };
      }

      return {
        name: match[1].trim(),
        quantity: Number(match[2]),
        unit: match[3]?.trim() ?? null,
      };
    });
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatQuantity(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1).replace(/\.0$/, "");
}

export function formatSlot(slot: "main" | "side" | "soup") {
  if (slot === "main") return "主菜";
  if (slot === "side") return "副菜";
  return "汁物";
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getShoppingItemKey(item: Pick<ShoppingListItem, "ingredientId" | "unit">) {
  return `${item.ingredientId}:${item.unit}`;
}

export function groupShoppingItems(items: ShoppingListItem[]) {
  return SHOPPING_CATEGORY_ORDER.map((category) => {
    const categoryItems = items.filter((item) => item.category === category);
    return {
      category,
      items: categoryItems,
      subtotal: categoryItems.reduce((sum, item) => sum + item.estimatedPrice, 0),
    };
  }).filter((group) => group.items.length > 0);
}
