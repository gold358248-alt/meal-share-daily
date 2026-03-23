export type DishSlot = "main" | "side" | "soup";

export type MainProtein =
  | "chicken"
  | "pork"
  | "fish"
  | "egg"
  | "tofu"
  | "vegetable"
  | "mixed"
  | "other";

export type Cuisine = "japanese" | "western" | "chinese" | "curry" | "home";

export type CookingMethod =
  | "grill"
  | "stir-fry"
  | "simmer"
  | "don"
  | "curry"
  | "salad"
  | "soup"
  | "mix";

export type FlavorProfile =
  | "sweet-savory"
  | "savory"
  | "mild"
  | "creamy"
  | "spicy"
  | "refreshing"
  | "miso"
  | "tomato"
  | "umami";

export type Richness = "light" | "balanced" | "hearty" | "rich";

export type IngredientCategory =
  | "肉・魚"
  | "野菜"
  | "卵・乳"
  | "豆腐・乾物"
  | "その他"
  | "調味料";

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  category: IngredientCategory;
}

export interface Recipe {
  id: string;
  name: string;
  slot: DishSlot;
  description: string;
  baseServings: number;
  cookTimeMinutes: number;
  estimatedCost: number;
  tags: string[];
  mainProtein: MainProtein;
  cuisine: Cuisine;
  cookingMethod: CookingMethod;
  flavor: FlavorProfile;
  richness: Richness;
  similarGroup: string;
  moodTags: string[];
  ingredients: Ingredient[];
  steps: string[];
}

export interface PlannerInput {
  budget: number;
  people: number;
  days: number;
  preferences: string[];
  dislikes: string[];
  allergies: string[];
  pantry: string;
  strategy?: "balanced" | "budget" | "quick" | "preference";
}

export interface PantryItem {
  name: string;
  quantity: number | null;
  unit: string | null;
}

export interface PlannedDish {
  slot: DishSlot;
  recipeId: string;
  name: string;
  description: string;
  cookTimeMinutes: number;
  estimatedCost: number;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  mainProtein: MainProtein;
  cuisine: Cuisine;
  cookingMethod: CookingMethod;
  flavor: FlavorProfile;
  richness: Richness;
  similarGroup: string;
  moodLabels: string[];
  satisfactionLabel: string;
  easeLabel: string;
  recommendationReason: string;
}

export interface DayPlan {
  day: number;
  title: string;
  dishes: PlannedDish[];
  totalCost: number;
  totalCookTimeMinutes: number;
}

export interface ShoppingListItem {
  ingredientId: string;
  name: string;
  unit: string;
  requiredQuantity: number;
  pantryQuantity: number | null;
  shortageQuantity: number;
  estimatedPrice: number;
  category: IngredientCategory;
}

export interface PlanSummary {
  budget: number;
  totalEstimatedCost: number;
  difference: number;
  averageDailyCost: number;
  withinBudget: boolean;
  warnings: string[];
}

export interface PlanResult {
  generatedAt: string;
  input: PlannerInput;
  days: DayPlan[];
  shoppingList: ShoppingListItem[];
  summary: PlanSummary;
}

export interface SavedPlanEntry {
  id: string;
  savedAt: string;
  plan: PlanResult;
}

export type AnalyticsEventName =
  | "home_view"
  | "planner_start"
  | "plan_generated"
  | "shopping_view"
  | "plan_saved"
  | "plan_regenerated"
  | "list_shared"
  | "external_link_clicked";
