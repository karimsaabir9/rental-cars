import { pgTable, text, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { user } from "@/db/schema/auth";
import { cars } from "@/db/schema/cars";

// One review per user per car; editing replaces the existing row rather
// than creating a new one, keeping a car's rating tied to distinct renters.
export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    carId: text("car_id")
      .notNull()
      .references(() => cars.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.carId, table.userId)],
);
