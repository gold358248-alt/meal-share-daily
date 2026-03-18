"use client";

import { useEffect } from "react";
import { AnalyticsEventName } from "@/types";

const SESSION_KEY = "meal-share-daily:session-id";

function getSessionId() {
  if (typeof window === "undefined") return "server";

  const current = window.localStorage.getItem(SESSION_KEY);
  if (current) return current;

  const next = `session_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(SESSION_KEY, next);
  return next;
}

export function trackEvent(name: AnalyticsEventName, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    name,
    payload,
    sessionId: getSessionId(),
    path: window.location.pathname,
    href: window.location.href,
    timestamp: new Date().toISOString(),
    referrer: document.referrer || null,
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/events", blob);
      return;
    }

    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Beta analytics should never block the product flow.
  }
}

export function useTrackView(name: AnalyticsEventName, payload: Record<string, unknown> = {}) {
  useEffect(() => {
    trackEvent(name, payload);
  }, [name]);
}
