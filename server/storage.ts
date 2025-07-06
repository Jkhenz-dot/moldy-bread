import { users, guilds, commandUsage, botMessages, type User, type InsertUser, type Guild, type InsertGuild, type CommandUsage, type InsertCommandUsage, type BotMessage, type InsertBotMessage } from '../shared/schema';
import { db } from './db';
import { eq, desc, sql } from 'drizzle-orm';

export interface IStorage {
  // User methods
  getUser(discordId: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(discordId: string, updates: Partial<InsertUser>): Promise<User>;
  addXpToUser(discordId: string, xp: number): Promise<User>;
  
  // Guild methods
  getGuild(discordId: string): Promise<Guild | undefined>;
  createGuild(insertGuild: InsertGuild): Promise<Guild>;
  updateGuild(discordId: string, updates: Partial<InsertGuild>): Promise<Guild>;
  
  // Command usage tracking
  logCommandUsage(usage: InsertCommandUsage): Promise<CommandUsage>;
  getCommandStats(guildId?: number): Promise<any[]>;
  
  // Bot messages
  logBotMessage(message: InsertBotMessage): Promise<BotMessage>;
  getUserMessages(userId: number, limit?: number): Promise<BotMessage[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(discordId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.userId, discordId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(discordId: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.userId, discordId))
      .returning();
    return user;
  }

  async addXpToUser(discordId: string, xp: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        xp: sql`${users.xp} + ${xp}`,
        updatedAt: new Date()
      })
      .where(eq(users.userId, discordId))
      .returning();
    return user;
  }

  async getGuild(discordId: string): Promise<Guild | undefined> {
    const [guild] = await db.select().from(guilds).where(eq(guilds.guildId, discordId));
    return guild || undefined;
  }

  async createGuild(insertGuild: InsertGuild): Promise<Guild> {
    const [guild] = await db
      .insert(guilds)
      .values(insertGuild)
      .returning();
    return guild;
  }

  async updateGuild(discordId: string, updates: Partial<InsertGuild>): Promise<Guild> {
    const [guild] = await db
      .update(guilds)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(guilds.guildId, discordId))
      .returning();
    return guild;
  }

  async logCommandUsage(usage: InsertCommandUsage): Promise<CommandUsage> {
    const [commandUsageRecord] = await db
      .insert(commandUsage)
      .values(usage)
      .returning();
    return commandUsageRecord;
  }

  async getCommandStats(guildId?: number): Promise<any[]> {
    const query = db
      .select({
        commandName: commandUsage.commandName,
        count: sql<number>`count(*)`.as('count'),
        lastUsed: sql<Date>`max(${commandUsage.executedAt})`.as('last_used')
      })
      .from(commandUsage)
      .groupBy(commandUsage.commandName)
      .orderBy(desc(sql`count(*)`));

    if (guildId) {
      query.where(eq(commandUsage.guildId, guildId));
    }

    return await query;
  }

  async logBotMessage(message: InsertBotMessage): Promise<BotMessage> {
    const [botMessage] = await db
      .insert(botMessages)
      .values(message)
      .returning();
    return botMessage;
  }

  async getUserMessages(userId: number, limit: number = 50): Promise<BotMessage[]> {
    return await db
      .select()
      .from(botMessages)
      .where(eq(botMessages.userId, userId))
      .orderBy(desc(botMessages.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();