import { pgTable, text, integer, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";

export const carStatusEnum = pgEnum("car_status", ["available", "unavailable"]);
export const transmissionEnum = pgEnum("transmission", ["automatic", "manual"]);
export const fuelTypeEnum = pgEnum("fuel_type", ["petrol", "diesel", "electric", "hybrid"]);

export const cars = pgTable("cars", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  category: text("category").notNull(),
  pricePerDay: numeric("price_per_day", { precision: 10, scale: 2 }).notNull(),
  seats: integer("seats").notNull(),
  transmission: transmissionEnum("transmission").notNull(),
  fuelType: fuelTypeEnum("fuel_type").notNull(),
  licensePlate: text("license_plate").notNull().unique(),
  imageUrl: text("image_url"),
  description: text("description"),
  status: carStatusEnum("status").notNull().default("available"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
