import type { Metadata } from "next";
import { ResultShell } from "@/components/result-shell";

export const metadata: Metadata = {
  title: "献立結果",
  description: "生成した複数日分の献立プランを確認します。",
  robots: { index: false, follow: false },
};

export default function ResultsPage() {
  return <ResultShell mode="results" />;
}
