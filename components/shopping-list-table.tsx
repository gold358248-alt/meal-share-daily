"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FeedbackToast } from "@/components/feedback-toast";
import { trackEvent } from "@/lib/analytics";
import { buildShoppingShareText } from "@/lib/share";
import { loadShoppingChecks, saveShoppingChecks } from "@/lib/storage";
import { formatCurrency, formatQuantity, getShoppingItemKey, groupShoppingItems } from "@/lib/utils";
import { PlanResult, ShoppingListItem } from "@/types";

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function ShoppingListTable({ plan }: { plan: PlanResult }) {
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  const [toastTone, setToastTone] = useState<"default" | "success" | "warning">("default");
  const [checksReady, setChecksReady] = useState(false);
  const groups = groupShoppingItems(plan.shoppingList);
  const total = plan.shoppingList.reduce((sum, item) => sum + item.estimatedPrice, 0);
  const checkedCount = checkedKeys.length;
  const uncheckedItems = plan.shoppingList.filter((item) => !checkedKeys.includes(getShoppingItemKey(item)));

  useEffect(() => {
    setCheckedKeys(loadShoppingChecks(plan.generatedAt));
    setChecksReady(true);
  }, [plan.generatedAt]);

  useEffect(() => {
    if (!checksReady) return;
    saveShoppingChecks(plan.generatedAt, checkedKeys);
  }, [checkedKeys, checksReady, plan.generatedAt]);

  function toggleItem(item: ShoppingListItem) {
    const itemKey = getShoppingItemKey(item);
    setCheckedKeys((current) => current.includes(itemKey) ? current.filter((key) => key !== itemKey) : [...current, itemKey]);
  }

  async function handleCopyAll() {
    try {
      const text = buildShoppingShareText(plan, plan.shoppingList, { includeMenu: true });
      await copyText(text);
      trackEvent("list_shared", { method: "copy_all", itemCount: plan.shoppingList.length });
      setToastTone("success");
      setToastMessage("献立概要付きの買い物リストをコピーしました。");
    } catch {
      setToastTone("warning");
      setToastMessage("コピーに失敗しました。もう一度お試しください。");
    }
  }

  async function handleCopyUnchecked() {
    try {
      const target = uncheckedItems.length > 0 ? uncheckedItems : plan.shoppingList;
      const heading = uncheckedItems.length > 0 ? "【未チェックの買い物リスト】" : `【${plan.input.days}日分の献立用 買い物リスト】`;
      const text = buildShoppingShareText(plan, target, { includeMenu: false, heading });
      await copyText(text);
      trackEvent("list_shared", {
        method: uncheckedItems.length > 0 ? "copy_unchecked" : "copy_fallback_all",
        itemCount: target.length,
      });
      setToastTone("success");
      setToastMessage(uncheckedItems.length > 0 ? "未チェックの項目だけをコピーしました。" : "買い物リストをコピーしました。");
    } catch {
      setToastTone("warning");
      setToastMessage("コピーに失敗しました。もう一度お試しください。");
    }
  }

  async function handleShare() {
    try {
      const target = uncheckedItems.length > 0 ? uncheckedItems : plan.shoppingList;
      const shareText = buildShoppingShareText(plan, target, { includeMenu: true });
      const appUrl = window.location.origin;
      const fullText = `${shareText}\n\nアプリはこちら: ${appUrl}`;

      if (navigator.share) {
        try {
          await navigator.share({ title: "おうち献立ノート", text: fullText, url: appUrl });
          trackEvent("list_shared", { method: "web_share", itemCount: target.length });
          setToastTone("success");
          setToastMessage("共有シートを開きました。");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
        }
      }

      await copyText(fullText);
      trackEvent("list_shared", { method: "web_share_fallback_copy", itemCount: target.length });
      setToastTone("success");
      setToastMessage("共有用テキストをコピーしました。");
    } catch {
      setToastTone("warning");
      setToastMessage("共有テキストの作成に失敗しました。");
    }
  }

  function handleLineShare() {
    const target = uncheckedItems.length > 0 ? uncheckedItems : plan.shoppingList;
    const shareText = buildShoppingShareText(plan, target, { includeMenu: true });
    const appUrl = window.location.origin;
    const fullText = `${shareText}\n\nアプリはこちら: ${appUrl}`;
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(fullText)}`;

    trackEvent("list_shared", { method: "line", itemCount: target.length });
    window.open(lineUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <section className="space-y-4">
        <div className="card-surface overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="eyebrow">Shopping Actions</p>
                <h2 className="mt-3 text-2xl font-heading tracking-[-0.03em] text-[var(--color-ink)] sm:text-3xl">買い物にそのまま使える形に整理しました</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-ink-soft)]">
                  LINE 共有、コピー、チェック保持まで、買い物中に必要な操作を上にまとめています。
                </p>
                <p className="mt-2 text-xs leading-6 text-[var(--color-ink-muted)]">チェック状態はこの端末に自動保存されます。</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-5">
                <Link className="secondary-button !min-h-[46px] !px-4 !text-sm" href="/planner">
                  最初からやり直す
                </Link>
                <button className="primary-button !min-h-[46px] !px-4 !text-sm" onClick={handleLineShare} type="button">LINE共有</button>
                <button className="secondary-button !min-h-[46px] !px-4 !text-sm" onClick={handleCopyAll} type="button">コピー</button>
                <button className="secondary-button !min-h-[46px] !px-4 !text-sm" onClick={handleCopyUnchecked} type="button">未チェックをコピー</button>
                <button className="secondary-button !min-h-[46px] !px-4 !text-sm" onClick={handleShare} type="button">共有シート</button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 xl:grid-cols-4 sm:px-7">
            <div className="rounded-[1.4rem] bg-[rgba(241,232,220,0.72)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">合計目安</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{formatCurrency(total)}</p>
            </div>
            <div className="rounded-[1.4rem] bg-[rgba(255,255,255,0.82)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">項目数</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{plan.shoppingList.length}件</p>
            </div>
            <div className="rounded-[1.4rem] bg-[var(--color-success-bg)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">チェック済み</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{checkedCount}件</p>
            </div>
            <div className="rounded-[1.4rem] bg-[rgba(230,237,241,0.82)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">未チェック</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{uncheckedItems.length}件</p>
            </div>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="card-surface px-5 py-8 text-center sm:px-7">
            <p className="eyebrow">All Set</p>
            <h3 className="mt-3 text-2xl font-heading text-[var(--color-ink)]">今ある食材だけで足ります</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--color-ink-soft)]">買い足しは不要です。献立だけを見ながらそのまま調理に進めます。</p>
            <div className="mt-6 flex justify-center">
              <Link className="secondary-button" href="/results">献立に戻る</Link>
            </div>
          </div>
        ) : null}

        {groups.map((group) => (
          <section className="card-surface animate-rise overflow-hidden" key={group.category}>
            <div className="border-b border-[var(--color-border)] px-5 py-4 sm:px-7">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="eyebrow">{group.category}</p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--color-ink)]">{group.items.length}件</h3>
                </div>
                <span className="rounded-[var(--radius-pill)] bg-[rgba(241,232,220,0.72)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]">小計 {formatCurrency(group.subtotal)}</span>
              </div>
            </div>

            <div className="grid gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:grid-cols-2">
              {group.items.map((item) => {
                const itemKey = getShoppingItemKey(item);
                const checked = checkedKeys.includes(itemKey);

                return (
                  <div className={`flex gap-3 rounded-[1.4rem] border p-4 transition ${checked ? "border-[rgba(125,148,128,0.18)] bg-[rgba(237,243,236,0.86)]" : "border-[var(--color-border)] bg-[rgba(255,252,248,0.86)]"}`} key={itemKey}>
                    <label className="flex min-h-[40px] shrink-0 items-start pt-1">
                      <input checked={checked} className="h-5 w-5 accent-[var(--color-herb)]" onChange={() => toggleItem(item)} type="checkbox" />
                    </label>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-base font-semibold ${checked ? "text-[var(--color-ink-muted)] line-through" : "text-[var(--color-ink)]"}`}>{item.name}</p>
                          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">不足 {formatQuantity(item.shortageQuantity)}{item.unit}</p>
                        </div>
                        <p className="rounded-[var(--radius-pill)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--color-ink)]">{formatCurrency(item.estimatedPrice)}</p>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--color-ink-muted)]">
                        <div className="rounded-[1rem] bg-[rgba(255,255,255,0.74)] px-3 py-2">
                          <p>必要量</p>
                          <p className="mt-1 font-semibold text-[var(--color-ink)]">{formatQuantity(item.requiredQuantity)}{item.unit}</p>
                        </div>
                        <div className="rounded-[1rem] bg-[rgba(255,255,255,0.74)] px-3 py-2">
                          <p>在庫</p>
                          <p className="mt-1 font-semibold text-[var(--color-ink)]">{item.pantryQuantity === null ? "十分にあり" : `${formatQuantity(item.pantryQuantity)}${item.unit}`}</p>
                        </div>
                        <div className="rounded-[1rem] bg-[rgba(255,255,255,0.74)] px-3 py-2">
                          <p>差分</p>
                          <p className="mt-1 font-semibold text-[var(--color-ink)]">{formatQuantity(item.shortageQuantity)}{item.unit}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <a
                          className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-ink-soft)]"
                          href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(`${item.name} 食材`)}`}
                          onClick={() => trackEvent("external_link_clicked", {
                            destination: "amazon_search",
                            itemName: item.name,
                          })}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Amazonで探す
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </section>

      <FeedbackToast message={toastMessage} onClose={() => setToastMessage("")} tone={toastTone} />
    </>
  );
}
