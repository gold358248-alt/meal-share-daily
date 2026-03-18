import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { GlobalNavigation } from "@/components/global-navigation";
import { PageStatus } from "@/components/page-status";
import "@/app/globals.css";

const appName = "おうち献立ノート";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://meal-share-daily.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: appName,
  title: {
    default: `${appName} | 予算から献立と買い物リストをまとめて作成`,
    template: `%s | ${appName}`,
  },
  description:
    "予算・人数・日数・好みを入れるだけで、複数日分の献立と不足食材の買い物リストをスマホで見やすく作れる家庭向けアプリです。",
  openGraph: {
    title: `${appName} | 予算から献立と買い物リストをまとめて作成`,
    description:
      "予算と家にある食材をもとに、複数日分の献立と不足食材リストをまとめて作成。時短・節約・共有まで見据えた家庭向け献立アプリ。",
    type: "website",
    siteName: appName,
    locale: "ja_JP",
    images: [{ url: "/og-card.svg", width: 1200, height: 630, alt: `${appName} のOGP画像` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${appName} | 予算から献立と買い物リストをまとめて作成`,
    description: "複数日分の献立と不足食材リストを、スマホでそのまま使いやすい形で自動生成します。",
    images: ["/og-card.svg"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: appName,
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf6f0",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <div className="min-h-screen pb-24 md:pb-0">
          <GlobalNavigation />
          <PageStatus />
          {children}
          <footer className="app-shell pt-0">
            <div className="card-surface px-5 py-5 text-sm leading-7 text-[var(--color-ink-soft)] sm:px-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-2xl">
                  <p className="font-semibold text-[var(--color-ink)]">{appName}</p>
                  <p className="mt-2">
                    家庭向けの簡易献立提案アプリです。医療用途や厳密な栄養管理を目的としたものではありません。
                    アレルギーがある場合は最終的に食材表示をご自身でも確認してください。
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <Link className="footer-link" href="/">トップ</Link>
                  <Link className="footer-link" href="/planner">条件入力</Link>
                  <Link className="footer-link" href="/results">献立結果</Link>
                  <Link className="footer-link" href="/shopping">買い物リスト</Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
