import { pgTable, uuid, varchar, text, integer, timestamp, index, char, unique } from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const breeds = pgTable("breeds", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});

export const dogs = pgTable("dogs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  breedId: uuid("breed_id").notNull().references(() => breeds.id, { onDelete: "restrict" }),
  description: text("description").notNull().default(""),
  priceCents: integer("price_cents").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, (table) => [
  index("dogs_breed_id_idx").on(table.breedId),
  index("dogs_status_idx").on(table.status),
  unique("dogs_name_breed_unique").on(table.name, table.breedId)
]);

export const inquiries = pgTable("inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerName: varchar("customer_name", { length: 120 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  message: varchar("message", { length: 3000 }).notNull(),
  dogId: uuid("dog_id").references(() => dogs.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, (table) => [index("inquiries_status_idx").on(table.status)]);

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt()
});

export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminId: uuid("admin_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  tokenHash: char("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt()
}, (table) => [index("admin_sessions_expires_at_idx").on(table.expiresAt)]);
