import type { MetadataRoute } from "next";
import { getAllProducts } from "@/data/products";
import { SITE_URL } from "@/lib/site";

const STATIC_PATHS = [
  "/",
  "/shop",
  "/quality",
  "/faq",
  "/about",
  "/contact",
  "/shipping",
  "/legal/ruo-policy",
  "/legal/terms",
  "/legal/privacy",
  "/legal/refunds",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency: path === "/" || path === "/shop" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/shop" ? 0.9 : 0.6,
  }));

  const productEntries: MetadataRoute.Sitemap = getAllProducts().map((product) => ({
    url: `${SITE_URL}/shop/${product.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...productEntries];
}
