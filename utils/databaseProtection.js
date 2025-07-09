const dbManager = require('./database');

class DatabaseProtection {
    constructor() {
        this.dbManager = dbManager;
        this.backupInterval = null;
        this.healthCheckInterval = null;
        this.isHealthy = true;
        this.lastHealthCheck = new Date();
        this.failureCount = 0;
    }

    // Start comprehensive database protection
    startProtection() {
        console.log('Starting database protection system...');
        
        // Start periodic backups every 30 minutes
        this.backupInterval = setInterval(() => {
            this.createScheduledBackup();
        }, 30 * 60 * 1000); // 30 minutes

        // Start health checks every 5 minutes
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, 5 * 60 * 1000); // 5 minutes

        // Initial health check
        this.performHealthCheck();
        
        console.log('Database protection system active');
    }

    // Create scheduled backup
    async createScheduledBackup() {
        try {
            const client = await this.dbManager.getClient();
            
            // Create comprehensive backup
            await client.query(`
                INSERT INTO bot_config_backups (bot_type, config_data, created_by)
                SELECT 'bota', row_to_json(bota.*), 'scheduled_backup' FROM bota
            `);
            
            await client.query(`
                INSERT INTO bot_config_backups (bot_type, config_data, created_by)
                SELECT 'botb', row_to_json(botb.*), 'scheduled_backup' FROM botb
            `);
            
            await client.query(`
                INSERT INTO others_backups (config_data)
                SELECT row_to_json(others.*) FROM others
            `);

            // Clean up old backups (keep last 50 backups)
            await client.query(`
                DELETE FROM bot_config_backups 
                WHERE id NOT IN (
                    SELECT id FROM bot_config_backups 
                    ORDER BY backup_date DESC 
                    LIMIT 50
                )
            `);

            await client.query(`
                DELETE FROM others_backups 
                WHERE id NOT IN (
                    SELECT id FROM others_backups 
                    ORDER BY backup_date DESC 
                    LIMIT 50
                )
            `);

            client.release();
            console.log('Scheduled database backup completed');
            
        } catch (error) {
            console.error('Scheduled backup failed:', error);
            this.failureCount++;
        }
    }

    // Perform database health check
    async performHealthCheck() {
        try {
            const client = await this.dbManager.getClient();
            
            // Test basic operations
            await client.query('SELECT 1');
            await client.query('SELECT COUNT(*) FROM bota');
            await client.query('SELECT COUNT(*) FROM botb');
            await client.query('SELECT COUNT(*) FROM others');

            client.release();
            
            if (!this.isHealthy) {
                console.log('Database connection restored');
                this.isHealthy = true;
                this.failureCount = 0;
            }
            
            this.lastHealthCheck = new Date();
            
        } catch (error) {
            console.error('Database health check failed:', error);
            this.isHealthy = false;
            this.failureCount++;
            
            // Attempt recovery if multiple failures
            if (this.failureCount >= 3) {
                console.log('Attempting database recovery...');
                await this.dbManager.forceReconnect();
                this.failureCount = 0;
            }
        }
    }

    // Get database health status
    getHealthStatus() {
        return {
            isHealthy: this.isHealthy,
            lastHealthCheck: this.lastHealthCheck,
            failureCount: this.failureCount,
            backupSystemActive: this.backupInterval !== null
        };
    }

    // Get recent backups
    async getRecentBackups() {
        try {
            const client = await this.dbManager.getClient();
            
            const result = await client.query(`
                SELECT id, bot_type, backup_date, created_by 
                FROM bot_config_backups 
                ORDER BY backup_date DESC 
                LIMIT 10
            `);
            
            client.release();
            return result.rows;
            
        } catch (error) {
            console.error('Error retrieving backups:', error);
            return [];
        }
    }

    // Manual backup creation
    async createManualBackup(reason = 'manual_backup') {
        try {
            const client = await this.dbManager.getClient();
            
            await client.query(`
                INSERT INTO bot_config_backups (bot_type, config_data, created_by)
                SELECT 'bota', row_to_json(bota.*), $1 FROM bota
            `, [reason]);
            
            await client.query(`
                INSERT INTO bot_config_backups (bot_type, config_data, created_by)
                SELECT 'botb', row_to_json(botb.*), $1 FROM botb
            `, [reason]);
            
            await client.query(`
                INSERT INTO others_backups (config_data)
                SELECT row_to_json(others.*) FROM others
            `);

            client.release();
            console.log(`Manual backup created: ${reason}`);
            return true;
            
        } catch (error) {
            console.error('Manual backup failed:', error);
            return false;
        }
    }

    // Stop protection system
    stopProtection() {
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }
        
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        
        console.log('Database protection system stopped');
    }
}

module.exports = { DatabaseProtection };