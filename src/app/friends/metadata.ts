import { generateBaseMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generateBaseMetadata({
  title: "友情链接",
  description: "推荐的优质网站和技术资源",
  keywords: ["友情链接", "推荐", "网站", "资源", "技术"],
}); 