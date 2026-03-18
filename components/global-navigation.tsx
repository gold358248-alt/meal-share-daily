"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { FeedbackToast } from "@/components/feedback-toast";
import { HeaderNav, NavItem } from "@/components/header-nav";
import { loadLatestPlan } from "@/lib/storage";

const baseItems = [
  { href: "/", label: "ホーム" },
  { href: "/planner", label: "条件入力" },
  { href: "/results", label: "献立結果", requiresPlan: true },
  { href: "/shopping", label: "買い物リスト", requiresPlan: true },
] as const;

export function GlobalNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [hasPlan, setHasPlan] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    setHasPlan(Boolean(loadLatestPlan()));
  }, [pathname]);

  const items: NavItem[] = baseItems.map((item) => ({
    href: item.href,
    label: item.label,
    active: pathname === item.href,
    disabled: ("requiresPlan" in item ? item.requiresPlan : false) && !hasPlan,
  }));

  function handleNavigate(item: NavItem) {
    if (item.disabled) {
      setToastMessage("先に条件を入力してください");
      window.setTimeout(() => {
        if (pathname !== "/planner") {
          router.push("/planner");
        }
      }, 450);
    }
  }

  return (
    <>
      <HeaderNav items={items} onNavigate={handleNavigate} />
      <BottomTabBar items={items} onNavigate={handleNavigate} />
      <FeedbackToast message={toastMessage} onClose={() => setToastMessage("")} tone="warning" />
    </>
  );
}
