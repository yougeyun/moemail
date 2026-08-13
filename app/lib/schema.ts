import { integer, sqliteTable, text, primaryKey, uniqueIndex, index } from "drizzle-orm/sqlite-core"
import type { AdapterAccountType } from "next-auth/adapters"
import { relations, sql } from 'drizzle-orm';

// https://authjs.dev/getting-started/adapters/drizzle
export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  username: text("username").unique(),
  password: text("password"),
  points: integer("points").notNull().default(0),
})
export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  })
)

export const emails = sqliteTable("email", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  address: text("address").notNull().unique(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => ({
  expiresAtIdx: index("email_expires_at_idx").on(table.expiresAt),
  userIdIdx: index("email_user_id_idx").on(table.userId),
  addressLowerIdx: index("email_address_lower_idx").on(sql`LOWER(${table.address})`),
}))

export const messages = sqliteTable("message", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  emailId: text("emailId")
    .notNull()
    .references(() => emails.id, { onDelete: "cascade" }),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  html: text("html"),
  type: text("type"),
  receivedAt: integer("received_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  sentAt: integer("sent_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  emailIdIdx: index("message_email_id_idx").on(table.emailId),
  emailIdReceivedAtTypeIdx: index("message_email_id_received_at_type_idx").on(table.emailId, table.receivedAt, table.type),
}))

export const webhooks = sqliteTable('webhook', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text('url').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('webhook_user_id_idx').on(table.userId),
}))

export const roles = sqliteTable("role", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  icon: text("icon").notNull().default("User2"),
  permissions: text("permissions"),
  dailyLimit: integer("daily_limit"),
  allowedDomains: text("allowed_domains"),
  allowedExpiries: text("allowed_expiries"),
  defaultExpiry: integer("default_expiry"),
  price: integer("price").notNull().default(0),
  purchasable: integer("purchasable", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const userRoles = sqliteTable("user_role", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
  userIdIdx: index("user_role_user_id_idx").on(table.userId),
}));

export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  key: text('key').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
}, (table) => ({
  nameUserIdUnique: uniqueIndex('name_user_id_unique').on(table.name, table.userId),
  userIdIdx: index('api_keys_user_id_idx').on(table.userId),
}));

export const roleOrders = sqliteTable("role_order", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roleId: text("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "restrict" }),
  roleName: text("role_name").notNull(),
  roleDisplayName: text("role_display_name"),
  price: integer("price").notNull(),
  status: text("status").notNull().default("completed"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index("role_order_user_id_idx").on(table.userId),
  createdAtIdx: index("role_order_created_at_idx").on(table.createdAt),
}))

export const emailShares = sqliteTable('email_share', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  emailId: text('email_id')
    .notNull()
    .references(() => emails.id, { onDelete: "cascade" }),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
}, (table) => ({
  emailIdIdx: index('email_share_email_id_idx').on(table.emailId),
  tokenIdx: index('email_share_token_idx').on(table.token),
}));

export const messageShares = sqliteTable('message_share', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  messageId: text('message_id')
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
}, (table) => ({
  messageIdIdx: index('message_share_message_id_idx').on(table.messageId),
  tokenIdx: index('message_share_token_idx').on(table.token),
}));



export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  apiKeys: many(apiKeys),
  roleOrders: many(roleOrders),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  roleOrders: many(roleOrders),
}));

export const roleOrdersRelations = relations(roleOrders, ({ one }) => ({
  user: one(users, {
    fields: [roleOrders.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [roleOrders.roleId],
    references: [roles.id],
  }),
}));

export const emailSharesRelations = relations(emailShares, ({ one }) => ({
  email: one(emails, {
    fields: [emailShares.emailId],
    references: [emails.id],
  }),
}));

export const messageSharesRelations = relations(messageShares, ({ one }) => ({
  message: one(messages, {
    fields: [messageShares.messageId],
    references: [messages.id],
  }),
}));
