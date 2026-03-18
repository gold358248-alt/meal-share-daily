"use client";

import { useEffect } from "react";

export function FeedbackToast({
  message,
  tone = "default",
  onClose,
}: {
  message: string;
  tone?: "default" | "success" | "warning";
  onClose: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onClose, 2200);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const toneClass =
    tone === "success"
      ? "bg-[var(--color-success)] text-white"
      : tone === "warning"
        ? "bg-[var(--color-clay)] text-white"
        : "bg-[var(--color-ink)] text-white";

  return (
    <div
      aria-live="polite"
      className={`animate-toast fixed inset-x-4 bottom-24 z-50 rounded-[var(--radius-control)] px-4 py-3 text-center text-sm font-semibold shadow-[0_18px_30px_-20px_rgba(35,50,68,0.48)] md:inset-x-auto md:right-6 md:bottom-6 ${toneClass}`}
      role="status"
    >
      {message}
    </div>
  );
}
