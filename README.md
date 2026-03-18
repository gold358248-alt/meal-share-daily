# おうち献立ノート

このディレクトリは、他のアプリから完全に分離した独立プロジェクトです。  
既存の `/Users/bull/Documents/New project/app` などとは連動せず、`meal-share-daily` 単体で起動・ビルド・デプロイできます。

家庭向けの「予算内で複数日分の献立をつくり、不足食材の買い物リストまでまとめる」Web アプリです。  
知人に URL を送ってそのまま試してもらえることを前提に、スマホでの見やすさ、共有のしやすさ、Vercel への公開しやすさを重視しています。

## できること

- 予算、人数、日数、好み、苦手食材、アレルギー、家にある食材を入力
- 主菜 / 副菜 / 汁物を含む複数日分の献立を自動生成
- レシピごとの必要食材、手順、調理時間、概算費用を確認
- 複数日の食材を統合し、在庫を差し引いた不足食材だけを表示
- カテゴリ別の買い物リストをチェック付きで管理
- 買い物リストを LINE 共有、コピー、未チェックのみコピー、Web Share API で共有
- 直近の入力条件と買い物チェック状態をローカル保存
- ベータ配布向けのイベント計測

## ローカル起動方法

```bash
cd /Users/bull/Documents/New\ project/meal-share-daily
npm install
npm run dev
```

## ビルド方法

```bash
npm run typecheck
npm run build
```

## デプロイ時の注意

- モックデータだけでも動作します
- `NEXT_PUBLIC_SITE_URL` を設定すると OGP や共有リンクの URL が自然になります
- `ANALYTICS_WEBHOOK_URL` を設定するとイベントを外部 webhook に転送できます
- webhook を設定しない場合も、イベントは API Route からサーバーログへ出力されます
- OGP 画像は `public/og-card.svg` を使っています。ブランド調整時はここを差し替えてください
- `app/layout.tsx` の `metadataBase` は公開 URL に合わせて更新するとより自然です

## 計測イベント

- `home_view`
- `planner_start`
- `plan_generated`
- `shopping_view`
- `plan_saved`
- `plan_regenerated`
- `list_shared`
- `external_link_clicked`

## Vercel へ公開する最短手順

1. この `meal-share-daily` ディレクトリを GitHub に push
2. Vercel で新規プロジェクトを作成し、対象リポジトリを選択
3. Root Directory を `meal-share-daily` に設定
4. Build Command は `npm run build`
5. デプロイ後、必要なら `metadataBase` を実際の公開 URL に合わせて更新
