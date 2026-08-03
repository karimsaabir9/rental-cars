import type { MetadataRoute } from "next";

const APP_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/api"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
