import { pgTable, text, integer, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { CAR_CATEGORY_VALUES } from "@/lib/car-categories";

// "unavailable" is legacy and no longer written by the app (superseded by
// "maintenance"), kept in the enum to avoid a destructive migration. "rented"
// is intentionally not a stored value -- it's derived at query time from
// whether an approved booking currently covers today, so it can never go
// stale independent of the bookings table.
export const carStatusEnum = pgEnum("car_status", ["available", "unavailable", "maintenance"]);
export const transmissionEnum = pgEnum("transmission", ["automatic", "manual"]);
export const fuelTypeEnum = pgEnum("fuel_type", ["petrol", "diesel", "electric", "hybrid"]);
export const carCategoryEnum = pgEnum("car_category", CAR_CATEGORY_VALUES);

export const cars = pgTable("cars", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  category: carCategoryEnum("category").notNull(),
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
