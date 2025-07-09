const { Pool } = require("pg");

class DatabaseManager {
    constructor() {
        const connectionConfig = {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL
                ? { rejectUnauthorized: false }
                : false,
            max: 5, // Reduced pool size to prevent connection overload
            min: 1, // Minimum 1 connection
            idleTimeoutMillis: 30000, // 30 seconds idle timeout
            connectionTimeoutMillis: 10000, // 10 seconds connection timeout
            acquireTimeoutMillis: 15000, // 15 seconds to acquire connection
            statement_timeout: 30000, // 30 seconds statement timeout
            query_timeout: 30000, // 30 seconds query timeout
            keepAlive: true,
            keepAliveInitialDelayMillis: 5000,
            application_name: "discord-bot",
        };

        console.log("Database connection config:", {
            hasConnectionString: !!process.env.DATABASE_URL,
            ssl: connectionConfig.ssl,
        });

        this.pool = new Pool(connectionConfig);

        this.pool.on("error", (err) => {
            // Handle connection termination gracefully (57P01 - administrator command)
            if (
                err.code === "57P01" ||
                err.message.includes("terminating connection") ||
                err.message.includes("administrator command")
            ) {
                // Database connection terminated by administrator, reconnecting silently
                this.forceReconnect();
            } else if (
                err.code !== "ECONNRESET" &&
                !err.message.includes("Connection terminated unexpectedly") &&
                !err.message.includes(
                    "server closed the connection unexpectedly",
                )
            ) {
                // Only log non-recoverable errors to avoid spam
                console.log("PostgreSQL pool error");
            }
        });

        this.pool.on("connect", (client) => {
            // Database connection established silently
        });

        this.pool.on("remove", (client) => {
            // Database connection removed from pool silently
        });
    }

    async forceReconnect() {
        try {
            // Force reconnecting to database silently
            // End all existing connections
            await this.pool.end();

            // Recreate the pool with same configuration
            const connectionConfig = {
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.DATABASE_URL
                    ? { rejectUnauthorized: false }
                    : false,
                max: 5,
                min: 1,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000,
                acquireTimeoutMillis: 15000,
                statement_timeout: 30000,
                query_timeout: 30000,
                keepAlive: true,
                keepAliveInitialDelayMillis: 5000,
                application_name: "discord-bot",
            };

            this.pool = new Pool(connectionConfig);

            // Re-attach event listeners
            this.pool.on("error", (err) => {
                console.log("PostgreSQL pool error");
                if (
                    err.code === "57P01" ||
                    err.message.includes("terminating connection") ||
                    err.message.includes("administrator command")
                ) {
                    // Database connection terminated, reconnecting silently
                    this.forceReconnect();
                }
            });

            this.pool.on("connect", (client) => {
                // Database connection established silently
            });

            this.pool.on("remove", (client) => {
                // Database connection removed from pool silently
            });

            // Database force reconnection completed silently
        } catch (error) {
            console.error("Failed to force reconnect database:", error);
        }
    }

    async query(text, params) {
        const start = Date.now();
        let client;
        try {
            client = await this.pool.connect();
            
            // Auto-backup critical operations
            if (text.toUpperCase().includes('UPDATE') || text.toUpperCase().includes('DELETE')) {
                await this.createAutoBackup(text, params);
            }
            
            const res = await client.query(text, params);
            return res;
        } catch (error) {
            const duration = Date.now() - start;
            console.error(`Query failed after ${duration}ms:`, text, error);

            // Retry on connection termination or timeout
            if (
                error.code === "57P01" ||
                error.message.includes("Connection terminated") ||
                error.message.includes("timeout") ||
                error.code === "ECONNRESET"
            ) {
                console.log(
                    "Retrying database query after connection error...",
                );
                try {
                    if (client) {
                        client.release(true); // Force release with error flag
                        client = null;
                    }
                    // Wait a moment before retry
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    client = await this.pool.connect();
                    const res = await client.query(text, params);
                    // Database query retry successful
                    return res;
                } catch (retryError) {
                    console.error("Database retry failed:", retryError);
                    // For critical failures, return null instead of crashing
                    if (
                        retryError.code === "57P01" ||
                        retryError.message.includes("terminating connection")
                    ) {
                        // Database unavailable, returning empty result to prevent crash
                        return { rows: [] };
                    }
                    throw retryError;
                }
            }
            throw error;
        } finally {
            if (client) {
                try {
                    client.release();
                } catch (releaseError) {
                    console.log(
                        "Error releasing database client:",
                        releaseError.message,
                    );
                    // Force release even if there's an error
                    try {
                        client.release(true);
                    } catch (forceReleaseError) {
                        console.log(
                            "Force release also failed, connection may be lost",
                        );
                    }
                }
            }
        }
    }

    async getClient() {
        return this.pool.connect();
    }

    async close() {
        await this.pool.end();
        console.info("Database connection closed");
    }

    async createAutoBackup(queryText, params) {
        try {
            // Only backup if it's a potentially destructive operation
            if (queryText.toUpperCase().includes('UPDATE bota') || 
                queryText.toUpperCase().includes('UPDATE botb') ||
                queryText.toUpperCase().includes('UPDATE others')) {
                
                const backupClient = await this.pool.connect();
                
                // Backup bot configurations
                await backupClient.query(`
                    INSERT INTO bot_config_backups (bot_type, config_data)
                    SELECT 'bota', row_to_json(bota.*) FROM bota
                `);
                
                await backupClient.query(`
                    INSERT INTO bot_config_backups (bot_type, config_data)
                    SELECT 'botb', row_to_json(botb.*) FROM botb
                `);
                
                // Backup others table
                await backupClient.query(`
                    INSERT INTO others_backups (config_data)
                    SELECT row_to_json(others.*) FROM others
                `);
                
                backupClient.release();
            }
        } catch (error) {
            // Backup failure shouldn't block the main operation
            console.log('Auto-backup failed, continuing with operation');
        }
    }

    async restoreFromBackup(backupId, tableName) {
        try {
            const client = await this.pool.connect();
            
            if (tableName === 'bota' || tableName === 'botb') {
                const backupResult = await client.query(`
                    SELECT config_data FROM bot_config_backups 
                    WHERE id = $1 AND bot_type = $2
                `, [backupId, tableName]);
                
                if (backupResult.rows.length > 0) {
                    const config = backupResult.rows[0].config_data;
                    
                    // Restore the configuration
                    await client.query(`
                        DELETE FROM ${tableName};
                        INSERT INTO ${tableName} (${Object.keys(config).join(', ')})
                        VALUES (${Object.keys(config).map((_, i) => `$${i + 1}`).join(', ')})
                    `, Object.values(config));
                    
                    client.release();
                    return true;
                }
            }
            
            client.release();
            return false;
        } catch (error) {
            console.error('Error restoring from backup:', error);
            return false;
        }
    }

    // User management methods
    async getUser(discordId) {
        const query = "SELECT * FROM users WHERE discord_id = $1";
        const result = await this.query(query, [discordId]);
        return result.rows[0] || null;
    }

    async createUser(userData) {
        const query = `
            INSERT INTO users (discord_id, username, discriminator, avatar, joined_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (discord_id) DO UPDATE SET
                username = EXCLUDED.username,
                discriminator = EXCLUDED.discriminator,
                avatar = EXCLUDED.avatar,
                updated_at = NOW()
            RETURNING *
        `;
        const values = [
            userData.discordId,
            userData.username,
            userData.discriminator,
            userData.avatar,
            userData.joinedAt || new Date(),
        ];
        const result = await this.query(query, values);
        return result.rows[0];
    }

    async updateUserXP(discordId, xpToAdd) {
        const query = `
            UPDATE users 
            SET xp = xp + $1, 
                last_message_at = NOW(),
                updated_at = NOW()
            WHERE discord_id = $2
            RETURNING *
        `;
        const result = await this.query(query, [xpToAdd, discordId]);
        return result.rows[0];
    }

    async updateUserLevel(discordId, newLevel) {
        const query = `
            UPDATE users 
            SET level = $1, updated_at = NOW()
            WHERE discord_id = $2
            RETURNING *
        `;
        const result = await this.query(query, [newLevel, discordId]);
        return result.rows[0];
    }

    // Guild management methods
    async getGuild(discordId) {
        const query = "SELECT * FROM guilds WHERE discord_id = $1";
        const result = await this.query(query, [discordId]);
        return result.rows[0] || null;
    }

    async createGuild(guildData) {
        const query = `
            INSERT INTO guilds (discord_id, name, prefix)
            VALUES ($1, $2, $3)
            ON CONFLICT (discord_id) DO UPDATE SET
                name = EXCLUDED.name,
                updated_at = NOW()
            RETURNING *
        `;
        const values = [
            guildData.discordId,
            guildData.name,
            guildData.prefix || "!",
        ];
        const result = await this.query(query, values);
        return result.rows[0];
    }

    async updateGuildPrefix(discordId, newPrefix) {
        const query = `
            UPDATE guilds 
            SET prefix = $1, updated_at = NOW()
            WHERE discord_id = $2
            RETURNING *
        `;
        const result = await this.query(query, [newPrefix, discordId]);
        return result.rows[0];
    }

    // Command usage tracking
    async logCommandUsage(userId, guildId, commandName) {
        const query = `
            INSERT INTO command_usage (discord_id, guild_id, command_name)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await this.query(query, [userId, guildId, commandName]);
        return result.rows[0];
    }

    async getCommandStats(guildId = null) {
        let query = `
            SELECT 
                command_name,
                COUNT(*) as usage_count,
                MAX(used_at) as last_used
            FROM command_usage
        `;
        let params = [];

        if (guildId) {
            query += " WHERE guild_id = $1";
            params.push(guildId);
        }

        query += " GROUP BY command_name ORDER BY usage_count DESC";

        const result = await this.query(query, params);
        return result.rows;
    }

    // Bot message logging
    async logBotMessage(
        userId,
        guildId,
        messageContent,
        responseContent,
        messageType = "command",
    ) {
        const query = `
            INSERT INTO bot_messages (discord_id, guild_id, message_content, response_content, message_type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const result = await this.query(query, [
            userId,
            guildId,
            messageContent,
            responseContent,
            messageType,
        ]);
        return result.rows[0];
    }

    async getUserMessages(userId, limit = 50) {
        const query = `
            SELECT * FROM bot_messages
            WHERE discord_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        `;
        const result = await this.query(query, [userId, limit]);
        return result.rows;
    }

    // Leaderboard methods
    async getTopUsers(guildId = null, limit = 10) {
        let query = `
            SELECT u.*, g.name as guild_name
            FROM users u
            LEFT JOIN guilds g ON g.id = u.guild_id
        `;
        let params = [];

        if (guildId) {
            query += " WHERE g.discord_id = $1";
            params.push(guildId);
        }

        query += " ORDER BY u.xp DESC LIMIT $" + (params.length + 1);
        params.push(limit);

        const result = await this.query(query, params);
        return result.rows;
    }

    // Helper method to get user and guild IDs
    async getUserAndGuildIds(discordUserId, discordGuildId) {
        const userQuery = "SELECT id FROM users WHERE discord_id = $1";
        const guildQuery = "SELECT id FROM guilds WHERE discord_id = $1";

        const [userResult, guildResult] = await Promise.all([
            this.query(userQuery, [discordUserId]),
            this.query(guildQuery, [discordGuildId]),
        ]);

        return {
            userId: userResult.rows[0]?.id || null,
            guildId: guildResult.rows[0]?.id || null,
        };
    }
}

module.exports = new DatabaseManager();
