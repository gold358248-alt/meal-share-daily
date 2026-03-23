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
    mainProtein: recipe.mainProtein,
    cuisine: recipe.cuisine,
    cookingMethod: recipe.cookingMethod,
    flavor: recipe.flavor,
    richness: recipe.richness,
    similarGroup: recipe.similarGroup,
    moodLabels: getMoodLabels(recipe),
    satisfactionLabel: getSatisfactionLabel(recipe),
    easeLabel: getEaseLabel(recipe),
    recommendationReason: "",
  };
}

function getMoodLabels(recipe: Recipe) {
  return recipe.moodTags.slice(0, 3);
}

function getSatisfactionLabel(recipe: Recipe) {
  if (recipe.richness === "rich") return "ごちそう感あり";
  if (recipe.richness === "hearty") return "満足感 高め";
  if (recipe.richness === "light") return "軽やか";
  return "ほどよい満足感";
}

function getEaseLabel(recipe: Recipe) {
  if (recipe.cookTimeMinutes <= 12 || recipe.tags.includes("時短")) return "手軽";
  if (recipe.cookTimeMinutes <= 20) return "作りやすい";
  return "少し丁寧";
}

function buildRecommendationReason(recipe: Recipe, preferences: string[]) {
  const matched = recipe.moodTags.filter((tag) =>
    preferences.some((preference) => preference.includes(normalizeText(tag))),
  );

  if (matched.length > 0) {
    return `${matched[0]}気分に合いやすい主菜です`;
  }

  if (recipe.richness === "rich") return "少し特別感を出しつつ、ちゃんと満足しやすい一皿です";
  if (recipe.moodTags.includes("家庭的")) return "家で食べたい安心感のある主菜です";
  if (recipe.moodTags.includes("ごはんが進む")) return "ごはんと合わせたときの満足感を出しやすい主役です";
  return "今の条件で気分と食べごたえのバランスが良い主菜です";
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
  return recipe.mainProtein;
}

function getCookMethod(recipe: Recipe) {
  return recipe.cookingMethod;
}

function getCuisine(recipe: Recipe) {
  return recipe.cuisine;
}

function getPreferenceHits(recipe: Recipe, preferences: string[]) {
  const haystacks = [recipe.name, recipe.description, ...recipe.tags, ...recipe.moodTags].map(normalizeText);
  return preferences.reduce((hits, preference) => (
    haystacks.some((value) => value.includes(preference)) ? hits + 1 : hits
  ), 0);
}

function getMoodMatches(recipe: Recipe, preferences: string[]) {
  return recipe.moodTags.filter((tag) =>
    preferences.some((preference) => preference.includes(normalizeText(tag))),
  ).length;
}

function getRichnessScore(recipe: Recipe) {
  if (recipe.richness === "rich") return 4.8;
  if (recipe.richness === "hearty") return 3.8;
  if (recipe.richness === "balanced") return 2.8;
  return 1.8;
}

function getSpreadBonus(counts: Map<string, number>, key: string, baseBonus: number) {
  const count = counts.get(key) ?? 0;
  return Math.max(baseBonus - count * (baseBonus * 0.55), -baseBonus);
}

function getNameMarkers(name: string) {
  const normalized = normalizeText(name);
  const markers = [
    "照り焼き",
    "しょうが焼き",
    "甘辛",
    "丼",
    "カレー",
    "麻婆",
    "クリーム",
    "みそ煮",
    "バターしょうゆ",
    "炒め",
    "煮",
    "焼き",
  ];

  const matches = markers.filter((marker) => normalized.includes(normalizeText(marker)));
  return matches.length > 0 ? matches : normalized.match(/[a-z0-9ぁ-んァ-ヶ一-龠]{2,}/g) ?? [];
}

function haveSimilarName(left: Recipe, right: Recipe | null) {
  if (!right) return false;
  const leftMarkers = getNameMarkers(left.name);
  const rightMarkers = getNameMarkers(right.name);
  return leftMarkers.some((marker) => rightMarkers.includes(marker));
}

function scoreMainRecipe({
  recipe,
  usedIds,
  preferences,
  ingredientUsage,
  targetCost,
  strategy,
  previousRecipe,
  proteinCounts,
  cuisineCounts,
  methodCounts,
  flavorCounts,
  similarGroupCounts,
  dayIndex,
  totalDays,
}: {
  recipe: Recipe;
  usedIds: Set<string>;
  preferences: string[];
  ingredientUsage: Map<string, number>;
  targetCost: number;
  strategy: PlannerInput["strategy"];
  previousRecipe: Recipe | null;
  proteinCounts: Map<string, number>;
  cuisineCounts: Map<string, number>;
  methodCounts: Map<string, number>;
  flavorCounts: Map<string, number>;
  similarGroupCounts: Map<string, number>;
  dayIndex: number;
  totalDays: number;
}) {
  const preferenceHits = getPreferenceHits(recipe, preferences);
  const moodMatches = getMoodMatches(recipe, preferences);
  const ingredientReuse = recipe.ingredients.reduce(
    (score, ingredient) => score + (ingredientUsage.get(ingredient.id) ?? 0),
    0,
  );
  const protein = getMainIngredientGroup(recipe);
  const method = getCookMethod(recipe);
  const cuisine = getCuisine(recipe);
  const flavor = recipe.flavor;

  let score = moodMatches * 9.5;
  score += preferenceHits * 5.2;
  score += getRichnessScore(recipe) * 2.1;
  score += ingredientReuse * 0.35;
  score += usedIds.has(recipe.id) ? -8.5 : 2.2;
  score += getSpreadBonus(proteinCounts, protein, 5.8);
  score += getSpreadBonus(cuisineCounts, cuisine, 4.6);
  score += getSpreadBonus(methodCounts, method, 4.1);
  score += getSpreadBonus(flavorCounts, flavor, 3.5);
  score += getSpreadBonus(similarGroupCounts, recipe.similarGroup, 6.6);

  if (previousRecipe) {
    score += previousRecipe.mainProtein === protein ? -18 : 3.2;
    score += previousRecipe.cookingMethod === method ? -11 : 1.6;
    score += previousRecipe.flavor === flavor ? -9 : 1.4;
    score += previousRecipe.similarGroup === recipe.similarGroup ? -20 : 1.8;
    score += haveSimilarName(recipe, previousRecipe) ? -7.5 : 0;
  }

  if (totalDays >= 3) {
    score += (proteinCounts.get(protein) ?? 0) === 0 ? 3.2 : 0;
    score += (cuisineCounts.get(cuisine) ?? 0) === 0 ? 2.4 : 0;
    score += dayIndex >= 1 && recipe.mainProtein !== "mixed" ? 0.6 : 0;
  }

  if (strategy === "budget") {
    score += targetCost > 0 ? clamp(3.2 - recipe.estimatedCost / targetCost, -4.5, 3) : 0;
  } else {
    score += targetCost > 0 ? clamp(1.1 - recipe.estimatedCost / targetCost, -2.5, 1.4) : 0;
  }

  if (strategy === "quick") {
    score += clamp(5 - recipe.cookTimeMinutes / 6, -2.4, 4.2);
  }

  if (strategy === "preference") {
    score += moodMatches * 2.8 + preferenceHits * 2.1;
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
  const moodMatches = getMoodMatches(recipe, preferences);
  const ingredientReuse = recipe.ingredients.reduce(
    (score, ingredient) => score + (ingredientUsage.get(ingredient.id) ?? 0),
    0,
  );
  const sameCuisine = getCuisine(recipe) === getCuisine(mainRecipe) ? 2.2 : 0.8;
  const flavorBalance = recipe.flavor === mainRecipe.flavor ? -1.2 : 1.1;
  const budgetScore =
    targetCost > 0 ? clamp(1.8 - recipe.estimatedCost / targetCost, -2, 1.8) : 0;
  const timeScore =
    strategy === "quick" ? clamp(3.8 - recipe.cookTimeMinutes / 6, -1.6, 3.5) : 0;

  return (
    preferenceHits * 2.8 +
    moodMatches * 2.4 +
    ingredientReuse * 0.9 +
    sameCuisine +
    flavorBalance +
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

function narrowMainCandidates(
  pool: Recipe[],
  usedMainIds: Set<string>,
  proteinCounts: Map<string, number>,
  similarGroupCounts: Map<string, number>,
  daysRemaining: number,
) {
  let candidates = pool;
  const unusedRecipes = candidates.filter((recipe) => !usedMainIds.has(recipe.id));
  if (unusedRecipes.length >= daysRemaining) {
    candidates = unusedRecipes;
  }

  const freshGroups = candidates.filter((recipe) => (similarGroupCounts.get(recipe.similarGroup) ?? 0) === 0);
  if (freshGroups.length >= daysRemaining) {
    candidates = freshGroups;
  }

  const freshProteins = candidates.filter((recipe) => {
    if (recipe.mainProtein === "mixed") return true;
    return (proteinCounts.get(recipe.mainProtein) ?? 0) === 0;
  });
  if (freshProteins.length >= Math.min(daysRemaining, 2)) {
    candidates = freshProteins;
  }

  return candidates;
}

function getMainRecipeFromDay(day: DayPlan, recipeById: Map<string, Recipe>) {
  const mainDish = day.dishes.find((dish) => dish.slot === "main");
  return mainDish ? recipeById.get(mainDish.recipeId) ?? null : null;
}

function getOtherMainRecipes(days: DayPlan[], recipeById: Map<string, Recipe>, excludeDayIndex: number) {
  return days
    .filter((_, index) => index !== excludeDayIndex)
    .map((day) => getMainRecipeFromDay(day, recipeById))
    .filter(Boolean) as Recipe[];
}

function isSequentiallyDistinct(candidate: Recipe, neighbor: Recipe | null) {
  if (!neighbor) return true;
  if (candidate.mainProtein === neighbor.mainProtein) return false;
  if (candidate.cookingMethod === neighbor.cookingMethod) return false;
  if (candidate.flavor === neighbor.flavor) return false;
  if (candidate.similarGroup === neighbor.similarGroup) return false;
  if (haveSimilarName(candidate, neighbor)) return false;
  return true;
}

function scoreBudgetReplacement(
  candidate: Recipe,
  currentRecipe: Recipe,
  preferences: string[],
  prevRecipe: Recipe | null,
  nextRecipe: Recipe | null,
  otherMainRecipes: Recipe[],
  slot: DishSlot,
) {
  const saving = currentRecipe.estimatedCost - candidate.estimatedCost;
  const moodMatches = getMoodMatches(candidate, preferences);
  const preferenceHits = getPreferenceHits(candidate, preferences);
  const richnessGap = Math.abs(getRichnessScore(currentRecipe) - getRichnessScore(candidate));
  const sameRecipeElsewhere = otherMainRecipes.some((recipe) => recipe.id === candidate.id);
  const sameGroupElsewhere = otherMainRecipes.some((recipe) => recipe.similarGroup === candidate.similarGroup);
  const similarNameElsewhere = otherMainRecipes.some((recipe) => haveSimilarName(candidate, recipe));
  const sameProteinCount = otherMainRecipes.filter((recipe) => recipe.mainProtein === candidate.mainProtein).length;
  const sameCuisineCount = otherMainRecipes.filter((recipe) => recipe.cuisine === candidate.cuisine).length;
  const sameMethodCount = otherMainRecipes.filter((recipe) => recipe.cookingMethod === candidate.cookingMethod).length;
  const sameFlavorCount = otherMainRecipes.filter((recipe) => recipe.flavor === candidate.flavor).length;

  let score = saving / 45;
  score += moodMatches * 2.4;
  score += preferenceHits * 1.4;
  score -= richnessGap * 0.9;
  score += isSequentiallyDistinct(candidate, prevRecipe) ? 3.2 : -8;
  score += isSequentiallyDistinct(candidate, nextRecipe) ? 3.2 : -8;
  score += slot === "main" ? -4.5 : 2.8;

  if (slot === "main") {
    score += sameRecipeElsewhere ? -30 : 0;
    score += sameGroupElsewhere ? -24 : 0;
    score += similarNameElsewhere ? -12 : 0;
    score += sameProteinCount * -5.5;
    score += sameCuisineCount * -3.2;
    score += sameMethodCount * -2.8;
    score += sameFlavorCount * -2.4;
  }

  return score;
}

function replaceToFitBudget(
  days: DayPlan[],
  pools: Record<DishSlot, Recipe[]>,
  recipeById: Map<string, Recipe>,
  input: PlannerInput,
  preferences: string[],
) {
  const warnings: string[] = [];
  const people = input.people;
  let totalCost = days.reduce((sum, day) => sum + day.totalCost, 0);

  while (totalCost > input.budget) {
    let bestScore = Number.NEGATIVE_INFINITY;
    let bestChange:
      | {
          dayIndex: number;
          dishIndex: number;
          replacement: PlannedDish;
        }
      | undefined;

    days.forEach((day, dayIndex) => {
      day.dishes.forEach((dish, dishIndex) => {
        const currentRecipe = recipeById.get(dish.recipeId);
        if (!currentRecipe) return;
        const otherMainRecipes = dish.slot === "main" ? getOtherMainRecipes(days, recipeById, dayIndex) : [];

        const previousMain =
          dish.slot === "main" && dayIndex > 0 ? getMainRecipeFromDay(days[dayIndex - 1], recipeById) : null;
        const nextMain =
          dish.slot === "main" && dayIndex < days.length - 1
            ? getMainRecipeFromDay(days[dayIndex + 1], recipeById)
            : null;

        const cheaperCandidates = pools[dish.slot]
          .filter((candidate) => candidate.id !== dish.recipeId)
          .filter((candidate) => candidate.estimatedCost < currentRecipe.estimatedCost);

        const uniqueMainReplacements = cheaperCandidates.filter((candidate) =>
          dish.slot !== "main" ||
          (
            isSequentiallyDistinct(candidate, previousMain) &&
            isSequentiallyDistinct(candidate, nextMain) &&
            !otherMainRecipes.some((recipe) => recipe.id === candidate.id) &&
            !otherMainRecipes.some((recipe) => recipe.similarGroup === candidate.similarGroup) &&
            !otherMainRecipes.some((recipe) => haveSimilarName(candidate, recipe))
          ),
        );

        const distinctMainReplacements = cheaperCandidates.filter((candidate) =>
          dish.slot !== "main" ||
          (isSequentiallyDistinct(candidate, previousMain) && isSequentiallyDistinct(candidate, nextMain)),
        );

        const replacements =
          uniqueMainReplacements.length > 0
            ? uniqueMainReplacements
            : distinctMainReplacements.length > 0
              ? distinctMainReplacements
              : cheaperCandidates;

        replacements.forEach((candidate) => {
          const score = scoreBudgetReplacement(
            candidate,
            currentRecipe,
            preferences,
            previousMain,
            nextMain,
            otherMainRecipes,
            dish.slot,
          );

          if (score > bestScore) {
            bestScore = score;
            bestChange = { dayIndex, dishIndex, replacement: toPlannedDish(candidate, people) };
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
  const recipeById = new Map(filteredRecipes.map((recipe) => [recipe.id, recipe]));

  if (SLOT_ORDER.some((slot) => pools[slot].length === 0)) {
    throw new Error("条件に合う献立候補が不足しています。条件を少しゆるめて再度お試しください。");
  }

  const usedIds = new Set<string>();
  const usedMainIds = new Set<string>();
  const ingredientUsage = new Map<string, number>();
  const proteinCounts = new Map<string, number>();
  const cuisineCounts = new Map<string, number>();
  const methodCounts = new Map<string, number>();
  const flavorCounts = new Map<string, number>();
  const similarGroupCounts = new Map<string, number>();
  const budgetPerDay = input.budget / input.days;

  let previousMainRecipe: Recipe | null = null;

  const days: DayPlan[] = Array.from({ length: input.days }, (_, index) => {
    const mainCandidates = narrowMainCandidates(
      pools.main,
      usedMainIds,
      proteinCounts,
      similarGroupCounts,
      input.days - index,
    );

    const mainRecipe = pickBestRecipe(mainCandidates, (recipe) =>
      scoreMainRecipe({
        recipe,
        usedIds: usedMainIds,
        preferences: preferenceTerms,
        ingredientUsage,
        targetCost: budgetPerDay * 0.62,
        strategy,
        previousRecipe: previousMainRecipe,
        proteinCounts,
        cuisineCounts,
        methodCounts,
        flavorCounts,
        similarGroupCounts,
        dayIndex: index,
        totalDays: input.days,
      }),
    );

    if (!mainRecipe) {
      throw new Error("主菜候補の選択に失敗しました。");
    }

    usedIds.add(mainRecipe.id);
    usedMainIds.add(mainRecipe.id);
    const mainIngredient = getMainIngredientGroup(mainRecipe);
    const mainMethod = getCookMethod(mainRecipe);
    proteinCounts.set(mainIngredient, (proteinCounts.get(mainIngredient) ?? 0) + 1);
    cuisineCounts.set(mainRecipe.cuisine, (cuisineCounts.get(mainRecipe.cuisine) ?? 0) + 1);
    methodCounts.set(mainMethod, (methodCounts.get(mainMethod) ?? 0) + 1);
    flavorCounts.set(mainRecipe.flavor, (flavorCounts.get(mainRecipe.flavor) ?? 0) + 1);
    similarGroupCounts.set(mainRecipe.similarGroup, (similarGroupCounts.get(mainRecipe.similarGroup) ?? 0) + 1);
    previousMainRecipe = mainRecipe;

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

  const warnings = replaceToFitBudget(days, pools, recipeById, input, preferenceTerms);
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
