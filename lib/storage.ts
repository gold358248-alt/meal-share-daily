import { PlanResult, SavedPlanEntry } from "@/types";

const STORAGE_KEY = "meal-share-daily:last-plan";
const FORM_DRAFT_KEY = "meal-share-daily:planner-draft";
const SHOPPING_CHECK_KEY_PREFIX = "meal-share-daily:shopping-checks";
const SAVED_PLANS_KEY = "meal-share-daily:saved-plans";

export function saveLatestPlan(plan: PlanResult) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

export function loadLatestPlan() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlanResult;
  } catch {
    return null;
  }
}

export function savePlannerDraft(draft: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draft));
}

export function loadPlannerDraft() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(FORM_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return null;
  }
}

export function saveShoppingChecks(planId: string, itemKeys: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${SHOPPING_CHECK_KEY_PREFIX}:${planId}`,
    JSON.stringify(itemKeys),
  );
}

export function loadShoppingChecks(planId: string) {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(`${SHOPPING_CHECK_KEY_PREFIX}:${planId}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function savePlanEntry(plan: PlanResult) {
  if (typeof window === "undefined") return [];

  const current = loadSavedPlans();
  const nextEntry: SavedPlanEntry = {
    id: plan.generatedAt,
    savedAt: new Date().toISOString(),
    plan,
  };

  const deduped = current.filter((entry) => entry.id !== nextEntry.id);
  const next = [nextEntry, ...deduped].slice(0, 12);
  window.localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(next));
  return next;
}

export function loadSavedPlans() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(SAVED_PLANS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedPlanEntry[];
  } catch {
    return [];
  }
}
