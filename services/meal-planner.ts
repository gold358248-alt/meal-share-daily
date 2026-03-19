import { RECIPES } from "@/data/recipes";
import { clamp, normalizeText, parsePantryInput } from "@/lib/utils";
import {
  DayPlan,
  DishSlot,
  Ingredient,
  PantryItem,
  PlanResult,
  PlannedDish,
  PlannerInput,
  Recipe,
  ShoppingListItem,
} from "@/types";

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
    moodLabels: getMoodLabels(recipe),
    satisfactionLabel: getSatisfactionLabel(recipe),
    easeLabel: getEaseLabel(recipe),
    recommendationReason: "",
  };
}

function getMoodLabels(recipe: Recipe) {
  const candidates = [
    "がっつり",
    "さっぱり",
    "リッチ",
    "家庭的",
    "定番",
    "野菜多め",
    "子ども向け",
    "大人向け",
    "ご飯が進む",
    "お酒に合う",
    "和食",
    "洋食",
    "中華",
  ];

  return candidates.filter((tag) => recipe.tags.includes(tag)).slice(0, 3);
}

function getSatisfactionLabel(recipe: Recipe) {
  const tags = recipe.tags;
  if (tags.includes("がっつり") || tags.includes("リッチ") || tags.includes("ご飯が進む")) {
    return "満足感 高め";
  }
  if (tags.includes("さっぱり") || tags.includes("ヘルシー") || tags.includes("野菜多め")) {
    return "軽やか";
  }
  return "ほどよい満足感";
}

function getEaseLabel(recipe: Recipe) {
  if (recipe.cookTimeMinutes <= 12 || recipe.tags.includes("時短")) return "手軽";
  if (recipe.cookTimeMinutes <= 20) return "作りやすい";
  return "少し丁寧";
}

function buildRecommendationReason(recipe: Recipe, preferences: string[]) {
  const matched = getMoodLabels(recipe).filter((tag) =>
    preferences.some((preference) => preference.includes(normalizeText(tag))),
  );

  if (matched.length > 0) {
    return `${matched[0]}気分に寄せやすい主役です`;
  }

  if (recipe.tags.includes("家庭的")) return "家で食べたい安心感のある主菜です";
  if (recipe.tags.includes("ご飯が進む")) return "ごはんが進みやすく満足感を出せます";
  if (recipe.tags.includes("リッチ")) return "少し特別感が欲しい日に向いています";
  return "今の条件で満足度と作りやすさのバランスが良い一皿です";
}

function recipeIncludesBlockedTerm(recipe: Recipe, blockedTerms: string[]) {
  if (blockedTerms.length === 0) return false;
  const haystacks = [
    recipe.name,
    recipe.description,
    ...recipe.tags,
    ...recipe.ingredients.map((ingredient) => ingredient.name),
  ].map(normalizeText);

  return blockedTerms.some((blocked) =>
    haystacks.some((value) => value.includes(blocked)),
  );
}

function getMainIngredientGroup(recipe: Recipe) {
  const tags = recipe.tags.map(normalizeText);
  const name = normalizeText(recipe.name);

  if (tags.some((tag) => tag.includes("魚料理")) || /(鮭|さば|魚)/.test(name)) return "fish";
  if (tags.some((tag) => tag.includes("鶏肉料理"))) return "chicken";
  if (tags.some((tag) => tag.includes("豚肉料理"))) return "pork";
  if (tags.some((tag) => tag.includes("卵料理"))) return "egg";
  if (tags.some((tag) => tag.includes("豆腐")) || /(豆腐|厚揚げ)/.test(name)) return "tofu";
  if (tags.some((tag) => tag.includes("野菜中心料理"))) return "vegetable";
  return "other";
}

function getCookMethod(recipe: Recipe) {
  const name = recipe.name;
  const tags = recipe.tags.map(normalizeText);

  if (tags.some((tag) => tag.includes("丼もの"))) return "don";
  if (tags.some((tag) => tag.includes("カレー系"))) return "curry";
  if (recipe.slot === "soup") return "soup";
  if (/炒/.test(name)) return "stir-fry";
  if (/焼/.test(name)) return "grill";
  if (/煮/.test(name)) return "simmer";
  if (/(サラダ|和え)/.test(name)) return "salad";
  return recipe.slot;
}

function getCuisine(recipe: Recipe) {
  const tags = recipe.tags.map(normalizeText);
  if (tags.some((tag) => tag.includes("和食"))) return "japanese";
  if (tags.some((tag) => tag.includes("洋食") || tag.includes("洋風"))) return "western";
  if (tags.some((tag) => tag.includes("中華"))) return "chinese";
  return "home";
}

function getPreferenceHits(recipe: Recipe, preferences: string[]) {
  const haystacks = [recipe.name, recipe.description, ...recipe.tags].map(normalizeText);
  return preferences.reduce((hits, preference) => (
    haystacks.some((value) => value.includes(preference)) ? hits + 1 : hits
  ), 0);
}

function scoreMainRecipe({
  recipe,
  usedIds,
  preferences,
  ingredientUsage,
  targetCost,
  strategy,
  previousIngredient,
  previousMethod,
  ingredientCounts,
  methodCounts,
}: {
  recipe: Recipe;
  usedIds: Set<string>;
  preferences: string[];
  ingredientUsage: Map<string, number>;
  targetCost: number;
  strategy: PlannerInput["strategy"];
  previousIngredient: string | null;
  previousMethod: string | null;
  ingredientCounts: Map<string, number>;
  methodCounts: Map<string, number>;
}) {
  const preferenceHits = getPreferenceHits(recipe, preferences);
  const ingredientReuse = recipe.ingredients.reduce(
    (score, ingredient) => score + (ingredientUsage.get(ingredient.id) ?? 0),
    0,
  );
  const mainIngredient = getMainIngredientGroup(recipe);
  const method = getCookMethod(recipe);
  const budgetWeight = strategy === "budget" ? 3.4 : 1.6;
  const budgetScore =
    targetCost > 0 ? clamp(budgetWeight - recipe.estimatedCost / targetCost, -2.6, 2.4) : 0;

  let score = preferenceHits * 6.4;
  score += ingredientReuse * 0.45;
  score += usedIds.has(recipe.id) ? -7 : 3.2;
  score += (ingredientCounts.get(mainIngredient) ?? 0) * -2.8;
  score += (methodCounts.get(method) ?? 0) * -1.9;
  score += previousIngredient === mainIngredient ? -7.5 : 1.2;
  score += previousMethod === method ? -5.5 : 0.8;
  score += budgetScore;

  if (strategy === "quick") {
    score += clamp(4.2 - recipe.cookTimeMinutes / 7, -2.4, 4);
  }

  if (strategy === "preference") {
    score += preferenceHits * 2.2;
  }

  return score;
}

function scoreCompanionRecipe({
  recipe,
  mainRecipe,
  usedIds,
  preferences,
  ingredientUsage,
  targetCost,
  strategy,
}: {
  recipe: Recipe;
  mainRecipe: Recipe;
  usedIds: Set<string>;
  preferences: string[];
  ingredientUsage: Map<string, number>;
  targetCost: number;
  strategy: PlannerInput["strategy"];
}) {
  const preferenceHits = getPreferenceHits(recipe, preferences);
  const ingredientReuse = recipe.ingredients.reduce(
    (score, ingredient) => score + (ingredientUsage.get(ingredient.id) ?? 0),
    0,
  );
  const sameCuisine = getCuisine(recipe) === getCuisine(mainRecipe) ? 2 : 0.6;
  const budgetScore =
    targetCost > 0 ? clamp(2.2 - recipe.estimatedCost / targetCost, -2, 2) : 0;
  const timeScore =
    strategy === "quick" ? clamp(3.6 - recipe.cookTimeMinutes / 6, -1.6, 3.5) : 0;

  return (
    preferenceHits * 3.2 +
    ingredientReuse * 0.9 +
    sameCuisine +
    budgetScore +
    timeScore +
    (usedIds.has(recipe.id) ? -5 : 1.4)
  );
}

function pickBestRecipe(pool: Recipe[], scoreFn: (recipe: Recipe) => number) {
  return [...pool].sort((left, right) => {
    const diff = scoreFn(right) - scoreFn(left);
    if (diff !== 0) return diff;
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
      warnings.push("満足度を保てる範囲で最安候補まで調整しましたが、予算内には収まりませんでした。");
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
    throw new Error("条件に合う献立候補が不足しています。条件を少しゆるめて再度お試しください。");
  }

  const usedIds = new Set<string>();
  const ingredientUsage = new Map<string, number>();
  const mainIngredientCounts = new Map<string, number>();
  const methodCounts = new Map<string, number>();
  const budgetPerDay = input.budget / input.days;

  let previousMainIngredient: string | null = null;
  let previousMainMethod: string | null = null;

  const days: DayPlan[] = Array.from({ length: input.days }, (_, index) => {
    const mainRecipe = pickBestRecipe(pools.main, (recipe) =>
      scoreMainRecipe({
        recipe,
        usedIds,
        preferences: preferenceTerms,
        ingredientUsage,
        targetCost: budgetPerDay * 0.62,
        strategy,
        previousIngredient: previousMainIngredient,
        previousMethod: previousMainMethod,
        ingredientCounts: mainIngredientCounts,
        methodCounts,
      }),
    );

    if (!mainRecipe) {
      throw new Error("主菜候補の選択に失敗しました。");
    }

    usedIds.add(mainRecipe.id);
    const mainIngredient = getMainIngredientGroup(mainRecipe);
    const mainMethod = getCookMethod(mainRecipe);
    mainIngredientCounts.set(mainIngredient, (mainIngredientCounts.get(mainIngredient) ?? 0) + 1);
    methodCounts.set(mainMethod, (methodCounts.get(mainMethod) ?? 0) + 1);
    previousMainIngredient = mainIngredient;
    previousMainMethod = mainMethod;

    mainRecipe.ingredients.forEach((ingredient) => {
      ingredientUsage.set(ingredient.id, (ingredientUsage.get(ingredient.id) ?? 0) + 1);
    });

    const sideRecipe = pickBestRecipe(pools.side, (recipe) =>
      scoreCompanionRecipe({
        recipe,
        mainRecipe,
        usedIds,
        preferences: preferenceTerms,
        ingredientUsage,
        targetCost: budgetPerDay * 0.2,
        strategy,
      }),
    );

    const soupRecipe = pickBestRecipe(pools.soup, (recipe) =>
      scoreCompanionRecipe({
        recipe,
        mainRecipe,
        usedIds,
        preferences: preferenceTerms,
        ingredientUsage,
        targetCost: budgetPerDay * 0.18,
        strategy,
      }),
    );

    [sideRecipe, soupRecipe].filter(Boolean).forEach((recipe) => {
      const safeRecipe = recipe as Recipe;
      usedIds.add(safeRecipe.id);
      safeRecipe.ingredients.forEach((ingredient) => {
        ingredientUsage.set(ingredient.id, (ingredientUsage.get(ingredient.id) ?? 0) + 1);
      });
    });

    const recipeSet = [mainRecipe, sideRecipe, soupRecipe].filter(Boolean) as Recipe[];
    recipeSet.forEach((recipe) => {
      usedIds.add(recipe.id);
    });

    const dishes = recipeSet.map((recipe) => toPlannedDish(recipe, input.people));
    const mainDish = dishes.find((dish) => dish.slot === "main");
    if (mainDish) {
      mainDish.recommendationReason = buildRecommendationReason(mainRecipe, preferenceTerms);
    }

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
