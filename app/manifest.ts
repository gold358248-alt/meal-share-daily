import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "おうち献立ノート",
    short_name: "献立ノート",
    description: "予算から複数日分の献立と不足食材の買い物リストをまとめて作成できる家庭向けアプリ",
    start_url: "/?from=homescreen",
    display: "standalone",
    background_color: "#faf6f0",
    theme_color: "#faf6f0",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
