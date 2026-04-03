import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core'

// ── Enums ──────────────────────────────────────────────────────────────

export const messageRoleEnum = pgEnum('message_role', [
  'system',
  'user',
  'assistant',
  'tool',
])

export const appTypeEnum = pgEnum('app_type', [
  'server_tool',
  'hybrid_session',
  'client_widget',
])

export const runStatusEnum = pgEnum('run_status', [
  'created',
  'streaming_model',
  'invoking_tool',
  'awaiting_app_ack',
  'awaiting_user_action',
  'running',
  'succeeded',
  'failed',
  'cancelled',
  'timed_out',
])

// ── Users ──────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Sessions ───────────────────────────────────────────────────────────

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Conversations ──────────────────────────────────────────────────────

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Messages ───────────────────────────────────────────────────────────

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  toolCallId: text('tool_call_id'),
  toolName: text('tool_name'),
  tokenCountInput: integer('token_count_input'),
  tokenCountOutput: integer('token_count_output'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── App Definitions ────────────────────────────────────────────────────

export const appDefinitions = pgTable('app_definitions', {
  id: text('id').primaryKey(),
  version: text('version').notNull(),
  appType: appTypeEnum('app_type').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description').notNull(),
  toolSchemas: jsonb('tool_schemas').notNull(),
  sessionSchemaVersion: integer('session_schema_version').notNull().default(1),
  uiUrl: text('ui_url'),
  enabled: boolean('enabled').notNull().default(true),
  authRequirements: text('auth_requirements').notNull().default('none'),
  allowedOrigins: jsonb('allowed_origins'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── App Sessions ───────────────────────────────────────────────────────

export const appSessions = pgTable('app_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  appId: text('app_id')
    .notNull()
    .references(() => appDefinitions.id),
  status: text('status').notNull().default('active'),
  domainState: jsonb('domain_state'),
  viewState: jsonb('view_state'),
  stateVersion: integer('state_version').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Conversation Runs ──────────────────────────────────────────────────

export const conversationRuns = pgTable('conversation_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  status: runStatusEnum('status').notNull(),
  triggerMessageId: uuid('trigger_message_id'),
  model: text('model'),
  tokenCountInput: integer('token_count_input'),
  tokenCountOutput: integer('token_count_output'),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Run Steps ──────────────────────────────────────────────────────────

export const runSteps = pgTable('run_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id')
    .notNull()
    .references(() => conversationRuns.id, { onDelete: 'cascade' }),
  stepType: text('step_type').notNull(),
  appId: text('app_id'),
  toolName: text('tool_name'),
  input: jsonb('input'),
  output: jsonb('output'),
  status: text('status').notNull(),
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── App Events ─────────────────────────────────────────────────────────

export const appEvents = pgTable('app_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  appSessionId: uuid('app_session_id')
    .notNull()
    .references(() => appSessions.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  source: text('source').notNull(),
  correlationId: text('correlation_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── OAuth Connections ──────────────────────────────────────────────────

export const oauthConnections = pgTable('oauth_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  accessTokenEncrypted: text('access_token_encrypted').notNull(),
  refreshTokenEncrypted: text('refresh_token_encrypted'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  scopes: text('scopes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Audit Log ──────────────────────────────────────────────────────────

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
