import type { Metadata } from "next";
import { PlannerForm } from "@/components/planner-form";

export const metadata: Metadata = {
  title: "条件入力",
  description:
    "予算、人数、日数、好み、苦手食材、アレルギー、家にある食材を入力して、献立と買い物リストを作成します。",
};

export default function PlannerPage() {
  return <PlannerForm />;
}
