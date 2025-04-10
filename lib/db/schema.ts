import { pgTable, serial, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Firebase UID
  email: varchar("email", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  photoURL: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login").defaultNow().notNull(),
})

// Contacts table
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // "lend", "borrow", "recover", "payment"
  contactId: serial("contact_id")
    .notNull()
    .references(() => contacts.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  returnDate: timestamp("return_date"),
  method: varchar("method", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // "auth", "transaction", "contact"
  action: varchar("action", { length: 50 }).notNull(),
  details: text("details").notNull(),
  relatedId: text("related_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  deviceInfo: text("device_info"), // JSON string of device info
  location: text("location"),
})

// Let's also make sure the relations are properly defined to include the userId filter

// Update the transactionsRelations definition:
export const transactionsRelations = relations(transactions, ({ one }) => ({
  contact: one(contacts, {
    fields: [transactions.contactId, transactions.userId],
    references: [contacts.id, contacts.userId],
  }),
}))

// Export all tables for use with Drizzle ORM
export {
  users as usersTable,
  contacts as contactsTable,
  transactions as transactionsTable,
  activities as activitiesTable,
}
