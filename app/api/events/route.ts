import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { AnalyticsEventName } from "@/types";

type EventBody = {
  name?: AnalyticsEventName;
  payload?: Record<string, unknown>;
  sessionId?: string;
  path?: string;
  href?: string;
  timestamp?: string;
  referrer?: string | null;
};

const ALLOWED_EVENTS: AnalyticsEventName[] = [
  "home_view",
  "planner_start",
  "plan_generated",
  "shopping_view",
  "plan_saved",
  "plan_regenerated",
  "list_shared",
  "external_link_clicked",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EventBody;

    if (!body.name || !ALLOWED_EVENTS.includes(body.name)) {
      return NextResponse.json({ error: "Invalid event name" }, { status: 400 });
    }

    const requestHeaders = await headers();
    const record = {
      name: body.name,
      payload: body.payload ?? {},
      sessionId: body.sessionId ?? "unknown",
      path: body.path ?? "",
      href: body.href ?? "",
      timestamp: body.timestamp ?? new Date().toISOString(),
      referrer: body.referrer ?? null,
      userAgent: requestHeaders.get("user-agent"),
      forwardedFor: requestHeaders.get("x-forwarded-for"),
    };

    console.info("[meal-share-beta-event]", JSON.stringify(record));

    const webhookUrl = process.env.ANALYTICS_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
        cache: "no-store",
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}
