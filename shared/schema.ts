import { pgTable, serial, varchar, timestamp, text, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table for Discord bot (matches MongoDB UserData schema)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).unique().notNull(), // Discord user ID
  username: varchar('username', { length: 255 }),
  xp: integer('xp').default(0),
  level: integer('level').default(0),
  lastXpGain: timestamp('last_xp_gain').defaultNow(),
  conversationHistory: jsonb('conversation_history'), // Array of conversation objects
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Bot A configuration (BOTA) - clean individual fields
export const botA = pgTable('bota', {
  id: serial('id').primaryKey(),
  age: varchar('age', { length: 50 }),
  name: varchar('name', { length: 255 }).default('Heilos'),
  likes: text('likes'),
  others: text('others'),
  status: varchar('status', { length: 50 }).default('dnd'),
  dislikes: text('dislikes'),
  backstory: text('backstory'),
  appearance: text('appearance'),
  description: text('description'),
  personality: text('personality').default('helpful'),
  activityText: varchar('activity_text', { length: 255 }).default('NothingForNow'),
  activityType: varchar('activity_type', { length: 50 }).default('playing'),
  allowedChannels: text('allowed_channels'), // Single channel ID as text
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Bot B configuration (BOTB) - clean individual fields
export const botB = pgTable('botb', {
  id: serial('id').primaryKey(),
  age: varchar('age', { length: 50 }),
  name: varchar('name', { length: 255 }).default('Wisteria'),
  likes: text('likes'),
  others: text('others'),
  status: varchar('status', { length: 50 }).default('dnd'),
  dislikes: text('dislikes'),
  backstory: text('backstory'),
  appearance: text('appearance'),
  description: text('description'),
  personality: text('personality').default('helpful'),
  activityText: varchar('activity_text', { length: 255 }).default('NothingForNow'),
  activityType: varchar('activity_type', { length: 50 }).default('playing'),
  allowedChannels: text('allowed_channels'), // Single channel ID as text
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Others - clean system settings without nested JSON (XP Settings)
export const others = pgTable('others', {
  id: serial('id').primaryKey(),
  // XP Settings
  maxXp: integer('max_xp').default(15),
  minXp: integer('min_xp').default(1),
  xpCooldown: integer('xp_cooldown').default(70000),
  announcementChannel: varchar('announcement_channel', { length: 255 }).default('1390448595446268145'),
  levelUpAnnouncement: boolean('level_up_announcement').default(true),
  // Forum Auto React
  forumAutoReactEnabled: boolean('forum_auto_react_enabled').default(false),
  forumChannels: text('forum_channels'), // Comma-separated channel IDs
  // Counting Game
  countingEnabled: boolean('counting_enabled').default(false),
  countingChannel: varchar('counting_channel', { length: 255 }),
  currentCount: integer('current_count').default(0),
  // Welcomer Settings
  welcomerEnabled: boolean('welcomer_enabled').default(false),
  welcomerChannel: varchar('welcomer_channel', { length: 255 }),
  welcomerMessage: text('welcomer_message').default('Welcome to the server, {user}!'),
  welcomerEmbedEnabled: boolean('welcomer_embed_enabled').default(false),
  welcomerEmbedTitle: varchar('welcomer_embed_title', { length: 255 }).default('Welcome!'),
  welcomerEmbedDescription: text('welcomer_embed_description').default('Welcome to our server, {user}! We\'re glad you\'re here.'),
  welcomerEmbedColor: varchar('welcomer_embed_color', { length: 7 }).default('#7c3aed'),
  welcomerEmbedThumbnail: boolean('welcomer_embed_thumbnail').default(true),
  welcomerEmbedFooter: varchar('welcomer_embed_footer', { length: 255 }).default('Have a great time!'),
  // Auto Role Settings
  autoRoleEnabled: boolean('auto_role_enabled').default(false),
  autoRoleIds: text('auto_role_ids'), // Comma-separated role IDs
  // Stats
  totalMessages: integer('total_messages').default(0),
  totalCommands: integer('total_commands').default(0),
  totalUsers: integer('total_users').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Birthdays table (matches MongoDB Birthday schema)
export const birthdays = pgTable('birthdays', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  username: varchar('username', { length: 255 }),
  day: integer('day').notNull(),
  month: integer('month').notNull(),
  year: integer('year'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Level roles table (matches MongoDB LevelRoles schema)
export const levelRoles = pgTable('level_roles', {
  id: serial('id').primaryKey(),
  level: integer('level').notNull(),
  roleId: varchar('role_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Reaction roles table (matches MongoDB ReactionRole schema)
export const reactionRoles = pgTable('reaction_roles', {
  id: serial('id').primaryKey(),
  messageId: varchar('message_id', { length: 255 }).notNull(),
  channelId: varchar('channel_id', { length: 255 }).notNull(),
  emojiId: varchar('emoji_id', { length: 255 }).notNull(),
  roleId: varchar('role_id', { length: 255 }).notNull(),
  setId: varchar('set_id', { length: 255 }).notNull(), // Reaction role set identifier
  setName: varchar('set_name', { length: 255 }).notNull(), // Custom set name
  setMode: varchar('set_mode', { length: 20 }).notNull().default('multiple'), // 'single' or 'multiple'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// AI Questions table (matches MongoDB AIQuestions schema)
export const aiQuestions = pgTable('ai_questions', {
  id: serial('id').primaryKey(),
  category: varchar('category', { length: 100 }).notNull(),
  question: text('question').notNull(),
  difficulty: varchar('difficulty', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});



// Game stats table (matches MongoDB GameStats schema)
// Game stats table removed as requested

// Guilds table for Discord server configuration
export const guilds = pgTable('guilds', {
  id: serial('id').primaryKey(),
  guildId: varchar('guild_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  prefix: varchar('prefix', { length: 10 }).default('!'),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Command usage tracking table
export const commandUsage = pgTable('command_usage', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  guildId: integer('guild_id').references(() => guilds.id),
  commandName: varchar('command_name', { length: 100 }).notNull(),
  executedAt: timestamp('executed_at').defaultNow(),
});

// Bot messages table for conversation history
export const botMessages = pgTable('bot_messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  guildId: integer('guild_id').references(() => guilds.id),
  messageContent: text('message_content'),
  responseContent: text('response_content'),
  messageType: varchar('message_type', { length: 50 }).default('command'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  birthdays: many(birthdays),
}));

export const birthdaysRelations = relations(birthdays, ({ one }) => ({
  user: one(users, {
    fields: [birthdays.userId],
    references: [users.userId],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type BotA = typeof botA.$inferSelect;
export type InsertBotA = typeof botA.$inferInsert;
export type BotB = typeof botB.$inferSelect;
export type InsertBotB = typeof botB.$inferInsert;
export type Others = typeof others.$inferSelect;
export type InsertOthers = typeof others.$inferInsert;
export type Birthday = typeof birthdays.$inferSelect;
export type InsertBirthday = typeof birthdays.$inferInsert;
export type LevelRole = typeof levelRoles.$inferSelect;
export type InsertLevelRole = typeof levelRoles.$inferInsert;
export type ReactionRole = typeof reactionRoles.$inferSelect;
export type InsertReactionRole = typeof reactionRoles.$inferInsert;
export type AIQuestion = typeof aiQuestions.$inferSelect;
export type InsertAIQuestion = typeof aiQuestions.$inferInsert;
export type Guild = typeof guilds.$inferSelect;
export type InsertGuild = typeof guilds.$inferInsert;
export type CommandUsage = typeof commandUsage.$inferSelect;
export type InsertCommandUsage = typeof commandUsage.$inferInsert;
export type BotMessage = typeof botMessages.$inferSelect;
export type InsertBotMessage = typeof botMessages.$inferInsert;