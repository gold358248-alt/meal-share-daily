import { RECIPES } from "@/data/recipes";
import { DayPlan, DishSlot, Ingredient, PantryItem, PlanResult, PlannedDish, PlannerInput, Recipe, ShoppingListItem } from "@/types";
import { clamp, normalizeText, parsePantryInput } from "@/lib/utils";

const SLOT_ORDER: DishSlot[] = ["main", "side", "soup"];

function scaleIngredients(ingredients: Ingredient[], multiplier: number) {
  return ingredients.map((ingredient) => ({
    ...ingredient,
    quantity: Number((ingredient.quantity * multiplier).toFixed(2)),
    estimatedPrice: Number((ingredient.estimatedPrice * multiplier).toFixed(0)),
  }));
}

function toPlannedDish(recipe: Recipe, people: number): PlannedDish {
  const multiplier = people / recipe.baseServings;
  return {
    slot: recipe.slot,
    recipeId: recipe.id,
    name: recipe.name,
    description: recipe.description,
    cookTimeMinutes: recipe.cookTimeMinutes,
    estimatedCost: Number((recipe.estimatedCost * multiplier).toFixed(0)),
    ingredients: scaleIngredients(recipe.ingredients, multiplier),
    steps: recipe.steps,
    tags: recipe.tags,
  };
}

function recipeIncludesBlockedTerm(recipe: Recipe, blockedTerms: string[]) {
  if (blockedTerms.length === 0) return false;
  const haystacks = [recipe.name, recipe.description, ...recipe.tags, ...recipe.ingredients.map((ingredient) => ingredient.name)].map(normalizeText);
  return blockedTerms.some((blocked) => haystacks.some((value) => value.includes(blocked)));
}

function scoreRecipe(
  recipe: Recipe,
  usedIds: Set<string>,
  preferences: string[],
  ingredientUsage: Map<string, number>,
  targetCost: number,
  strategy: PlannerInput["strategy"],
) {
  const preferenceWeight = strategy === "preference" ? 5.5 : 3;
  const reuseWeight = strategy === "budget" ? 1.1 : 0.8;
  const timeScore =
    strategy === "quick" ? clamp(4 - recipe.cookTimeMinutes / 8, -2, 4) : 0;
  const preferenceHits = recipe.tags.filter((tag) =>
    preferences.some((preference) => normalizeText(tag).includes(preference)),
  ).length;
  const ingredientReuse = recipe.ingredients.reduce((score, ingredient) => score + (ingredientUsage.get(ingredient.id) ?? 0), 0);
  const uniquenessBonus = usedIds.has(recipe.id) ? -4 : 4;
  const budgetBias = strategy === "budget" ? 3.8 : 3;
  const budgetScore = targetCost > 0 ? clamp(budgetBias - recipe.estimatedCost / targetCost, -3, 3) : 0;
  return preferenceHits * preferenceWeight + ingredientReuse * reuseWeight + uniquenessBonus + budgetScore + timeScore;
}

function pickRecipe(
  pool: Recipe[],
  usedIds: Set<string>,
  preferences: string[],
  ingredientUsage: Map<string, number>,
  targetCost: number,
  strategy: PlannerInput["strategy"],
) {
  const available = pool.filter((recipe) => !usedIds.has(recipe.id));
  const workingPool = available.length > 0 ? available : pool;

  return [...workingPool].sort((left, right) => {
    const scoreDiff =
      scoreRecipe(right, usedIds, preferences, ingredientUsage, targetCost, strategy) -
      scoreRecipe(left, usedIds, preferences, ingredientUsage, targetCost, strategy);

    if (scoreDiff !== 0) return scoreDiff;
    return left.estimatedCost - right.estimatedCost;
  })[0];
}

function replaceToFitBudget(days: DayPlan[], pools: Record<DishSlot, Recipe[]>, input: PlannerInput) {
  const warnings: string[] = [];
  const people = input.people;
  let totalCost = days.reduce((sum, day) => sum + day.totalCost, 0);

  while (totalCost > input.budget) {
    let bestSaving = 0;
    let bestChange:
      | {
          dayIndex: number;
          dishIndex: number;
          replacement: PlannedDish;
        }
      | undefined;

    days.forEach((day, dayIndex) => {
      day.dishes.forEach((dish, dishIndex) => {
        const replacements = pools[dish.slot]
          .filter((candidate) => candidate.id !== dish.recipeId)
          .map((candidate) => toPlannedDish(candidate, people))
          .filter((candidate) => candidate.estimatedCost < dish.estimatedCost);

        replacements.forEach((candidate) => {
          const saving = dish.estimatedCost - candidate.estimatedCost;
          if (saving > bestSaving) {
            bestSaving = saving;
            bestChange = { dayIndex, dishIndex, replacement: candidate };
          }
        });
      });
    });

    if (!bestChange) {
      warnings.push("最安候補まで調整しましたが、現在の条件では予算内に収まりませんでした。");
      break;
    }

    const day = days[bestChange.dayIndex];
    day.dishes[bestChange.dishIndex] = bestChange.replacement;
    day.totalCost = day.dishes.reduce((sum, dish) => sum + dish.estimatedCost, 0);
    day.totalCookTimeMinutes = day.dishes.reduce((sum, dish) => sum + dish.cookTimeMinutes, 0);
    totalCost = days.reduce((sum, current) => sum + current.totalCost, 0);
  }

  return warnings;
}

function aggregateIngredients(days: DayPlan[]) {
  const ingredientMap = new Map<string, ShoppingListItem>();

  days.forEach((day) => {
    day.dishes.forEach((dish) => {
      dish.ingredients.forEach((ingredient) => {
        const key = `${ingredient.id}:${ingredient.unit}`;
        const unitPrice = ingredient.estimatedPrice / ingredient.quantity;
        const current = ingredientMap.get(key);

        if (!current) {
          ingredientMap.set(key, {
            ingredientId: ingredient.id,
            name: ingredient.name,
            unit: ingredient.unit,
            requiredQuantity: ingredient.quantity,
            pantryQuantity: 0,
            shortageQuantity: ingredient.quantity,
            estimatedPrice: ingredient.estimatedPrice,
            category: ingredient.category,
          });
          return;
        }

        current.requiredQuantity = Number((current.requiredQuantity + ingredient.quantity).toFixed(2));
        current.shortageQuantity = current.requiredQuantity;
        current.estimatedPrice = Number((current.estimatedPrice + ingredient.quantity * unitPrice).toFixed(0));
      });
    });
  });

  return ingredientMap;
}

function subtractPantry(ingredientMap: Map<string, ShoppingListItem>, pantryItems: PantryItem[]) {
  const pantryMap = new Map(pantryItems.map((item) => [normalizeText(item.name), item]));

  return [...ingredientMap.values()]
    .map((item) => {
      const pantryItem = pantryMap.get(normalizeText(item.name));

      if (!pantryItem) return item;

      if (pantryItem.quantity === null) {
        return { ...item, pantryQuantity: null, shortageQuantity: 0, estimatedPrice: 0 };
      }

      if (pantryItem.unit && pantryItem.unit !== item.unit) return item;

      const shortageQuantity = Math.max(item.requiredQuantity - pantryItem.quantity, 0);
      const unitPrice = item.requiredQuantity > 0 ? item.estimatedPrice / item.requiredQuantity : 0;

      return {
        ...item,
        pantryQuantity: pantryItem.quantity,
        shortageQuantity: Number(shortageQuantity.toFixed(2)),
        estimatedPrice: Number((shortageQuantity * unitPrice).toFixed(0)),
      };
    })
    .filter((item) => item.shortageQuantity > 0)
    .sort((left, right) => {
      if (left.category === right.category) {
        return left.name.localeCompare(right.name, "ja");
      }
      return left.category.localeCompare(right.category, "ja");
    });
}

export function generateMealPlan(input: PlannerInput): PlanResult {
  const strategy = input.strategy ?? "balanced";
  const blockedTerms = [...input.dislikes, ...input.allergies].map(normalizeText);
  const preferenceTerms = input.preferences.map(normalizeText);

  const filteredRecipes = RECIPES.filter((recipe) => !recipeIncludesBlockedTerm(recipe, blockedTerms));

  const pools = {
    main: filteredRecipes.filter((recipe) => recipe.slot === "main"),
    side: filteredRecipes.filter((recipe) => recipe.slot === "side"),
    soup: filteredRecipes.filter((recipe) => recipe.slot === "soup"),
  };

  if (SLOT_ORDER.some((slot) => pools[slot].length === 0)) {
    throw new Error("条件に合う献立候補が不足しています。苦手食材やアレルギー条件を見直してください。");
  }

  const usedIds = new Set<string>();
  const ingredientUsage = new Map<string, number>();
  const budgetPerDay = input.budget / input.days;
  const slotTarget = {
    main: budgetPerDay * (strategy === "budget" ? 0.55 : 0.62),
    side: budgetPerDay * (strategy === "budget" ? 0.24 : 0.2),
    soup: budgetPerDay * (strategy === "budget" ? 0.21 : 0.18),
  };

  const days: DayPlan[] = Array.from({ length: input.days }, (_, index) => {
    const dishes = SLOT_ORDER.map((slot) => {
      const recipe = pickRecipe(
        pools[slot],
        usedIds,
        preferenceTerms,
        ingredientUsage,
        slotTarget[slot],
        strategy,
      );
      if (!recipe) throw new Error("献立候補の選択に失敗しました。");

      usedIds.add(recipe.id);
      recipe.ingredients.forEach((ingredient) => {
        ingredientUsage.set(ingredient.id, (ingredientUsage.get(ingredient.id) ?? 0) + 1);
      });

      return toPlannedDish(recipe, input.people);
    });

    return {
      day: index + 1,
      title: `${index + 1}日目`,
      dishes,
      totalCost: dishes.reduce((sum, dish) => sum + dish.estimatedCost, 0),
      totalCookTimeMinutes: dishes.reduce((sum, dish) => sum + dish.cookTimeMinutes, 0),
    };
  });

  const warnings = replaceToFitBudget(days, pools, input);
  const totalEstimatedCost = days.reduce((sum, day) => sum + day.totalCost, 0);
  const shoppingList = subtractPantry(aggregateIngredients(days), parsePantryInput(input.pantry));

  return {
    generatedAt: new Date().toISOString(),
    input,
    days,
    shoppingList,
    summary: {
      budget: input.budget,
      totalEstimatedCost,
      difference: input.budget - totalEstimatedCost,
      averageDailyCost: Number((totalEstimatedCost / input.days).toFixed(0)),
      withinBudget: totalEstimatedCost <= input.budget,
      warnings,
    },
  };
}
