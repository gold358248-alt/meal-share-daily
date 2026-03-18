import type { Metadata } from "next";
import { ResultShell } from "@/components/result-shell";

export const metadata: Metadata = {
  title: "買い物リスト",
  description: "不足している食材だけをまとめた買い物リストを確認・共有します。",
  robots: { index: false, follow: false },
};

export default function ShoppingPage() {
  return <ResultShell mode="shopping" />;
}
