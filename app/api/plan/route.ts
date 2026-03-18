import { NextResponse } from "next/server";
import { generateMealPlan } from "@/services/meal-planner";
import { PlannerInput } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PlannerInput>;

    const input: PlannerInput = {
      budget: Number(body.budget ?? 0),
      people: Number(body.people ?? 0),
      days: Number(body.days ?? 0),
      preferences: Array.isArray(body.preferences) ? body.preferences : [],
      dislikes: Array.isArray(body.dislikes) ? body.dislikes : [],
      allergies: Array.isArray(body.allergies) ? body.allergies : [],
      pantry: typeof body.pantry === "string" ? body.pantry : "",
      strategy:
        body.strategy === "budget" ||
        body.strategy === "quick" ||
        body.strategy === "preference" ||
        body.strategy === "balanced"
          ? body.strategy
          : "balanced",
    };

    if (input.budget <= 0 || input.people <= 0 || input.days <= 0) {
      return NextResponse.json({ error: "予算・人数・日数は1以上で入力してください。" }, { status: 400 });
    }

    return NextResponse.json(generateMealPlan(input));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "献立の生成中にエラーが発生しました。" },
      { status: 500 },
    );
  }
}
