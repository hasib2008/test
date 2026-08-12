import { pgTable, serial, text, integer, boolean } from "drizzle-orm/pg-core";

export const pets = pgTable("pets", {
  PetId: serial("pet_id").primaryKey(),
  Name: text("name").notNull(),
  Species: text("species").notNull(),
  Breed: text("breed"),
  Age: integer("age"),
  Gender: text("gender"),
  Description: text("description"),
  PhotoUrl: text("photo_url"),
  Available: boolean("available").notNull().default(true),
});

export const adoption = pgTable("adoption", {
  Id: serial("id").primaryKey(),
  PetId: integer("pet_id")
    .notNull()
    .references(() => pets.PetId),
  Name: text("name").notNull(),
  Surname: text("surname").notNull(),
  City: text("city").notNull(),
  Email: text("email").notNull(),
  Phone: text("phone").notNull(),
  Status: text("status").notNull().default("Pending"),
});
