import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ===== Auth tables (Better Auth conventions) =====

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

// ===== Multi-tenancy: orgs + projects =====

export const organization = sqliteTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: text("owner_id").notNull().references(() => user.id, { onDelete: "restrict" }),
  plan: text("plan", { enum: ["free", "pro", "team", "enterprise"] }).notNull().default("free"),
  lsCustomerId: text("ls_customer_id"),
  lsSubscriptionId: text("ls_subscription_id"),
  lsVariantId: text("ls_variant_id"),
  subscriptionStatus: text("subscription_status"),
  currentPeriodEnd: integer("current_period_end", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  ownerIdx: index("organization_owner_idx").on(t.ownerId),
}));

export const orgMember = sqliteTable("org_member", {
  orgId: text("org_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["owner", "admin", "member"] }).notNull().default("member"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  pk: primaryKey({ columns: [t.orgId, t.userId] }),
  userIdx: index("org_member_user_idx").on(t.userId),
}));

export const project = sqliteTable("project", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  environment: text("environment", { enum: ["dev", "staging", "prod"] }).notNull().default("prod"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  orgIdx: index("project_org_idx").on(t.orgId),
}));

export const apiKey = sqliteTable("api_key", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
  createdById: text("created_by_id").notNull().references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  projectIdx: index("api_key_project_idx").on(t.projectId),
}));

// ===== Events (violations) =====

export const event = sqliteTable("event", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["injection", "tool", "memory"] }).notNull(),
  severity: text("severity", { enum: ["low", "medium", "high"] }).notNull(),
  pattern: text("pattern"),
  message: text("message"),
  sessionId: text("session_id"),
  source: text("source"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
  sdkLanguage: text("sdk_language", { enum: ["python", "typescript"] }),
  sdkVersion: text("sdk_version"),
  occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
  receivedAt: integer("received_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  projectOccurredIdx: index("event_project_occurred_idx").on(t.projectId, t.occurredAt),
  typeIdx: index("event_type_idx").on(t.type),
  severityIdx: index("event_severity_idx").on(t.severity),
  sessionIdx: index("event_session_idx").on(t.sessionId),
}));

// ===== Quotas / usage tracking =====

export const usageDaily = sqliteTable("usage_daily", {
  orgId: text("org_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  day: text("day").notNull(), // YYYY-MM-DD UTC
  eventCount: integer("event_count").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  pk: primaryKey({ columns: [t.orgId, t.day] }),
}));

// ===== Alert rules =====

export const alertRule = sqliteTable("alert_rule", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  filterType: text("filter_type", { enum: ["any", "injection", "tool", "memory"] }).notNull().default("any"),
  filterMinSeverity: text("filter_min_severity", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  channelType: text("channel_type", { enum: ["slack", "email", "webhook"] }).notNull(),
  channelTarget: text("channel_target").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  projectIdx: index("alert_rule_project_idx").on(t.projectId),
}));

export type User = typeof user.$inferSelect;
export type Organization = typeof organization.$inferSelect;
export type Project = typeof project.$inferSelect;
export type ApiKey = typeof apiKey.$inferSelect;
export type Event = typeof event.$inferSelect;
