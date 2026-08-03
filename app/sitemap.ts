import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cars } from "@/db/schema";

const APP_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const availableCars = await db
    .select({ id: cars.id, createdAt: cars.createdAt })
    .from(cars)
    .where(eq(cars.status, "available"));

  return [
    { url: APP_URL, changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/cars`, changeFrequency: "daily", priority: 0.9 },
    { url: `${APP_URL}/login`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${APP_URL}/signup`, changeFrequency: "yearly", priority: 0.2 },
    ...availableCars.map((car) => ({
      url: `${APP_URL}/cars/${car.id}`,
      lastModified: car.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
