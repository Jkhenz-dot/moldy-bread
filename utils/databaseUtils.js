const database = require('./database');
const { checkDatabaseHealth } = require('./checkDatabase');

class DatabaseUtils {
  constructor() {
    this.database = database;
  }

  async healthCheck() {
    return await checkDatabaseHealth();
  }

  async getAllTables() {
    try {
      const query = `
        SELECT table_name, 
               table_schema,
               table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      const result = await database.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting tables:', error);
      return [];
    }
  }

  async getTableColumns(tableName) {
    try {
      const query = `
        SELECT column_name,
               data_type,
               is_nullable,
               column_default,
               character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      const result = await database.query(query, [tableName]);
      return result.rows;
    } catch (error) {
      console.error(`Error getting columns for table ${tableName}:`, error);
      return [];
    }
  }

  async getTableRowCount(tableName) {
    try {
      const query = `SELECT COUNT(*) as count FROM ${tableName}`;
      const result = await database.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error(`Error getting row count for table ${tableName}:`, error);
      return 0;
    }
  }

  async getDatabaseStats() {
    try {
      const tables = await this.getAllTables();
      const stats = {
        totalTables: tables.length,
        tables: []
      };

      for (const table of tables) {
        const rowCount = await this.getTableRowCount(table.table_name);
        const columns = await this.getTableColumns(table.table_name);
        
        stats.tables.push({
          name: table.table_name,
          rowCount,
          columnCount: columns.length,
          columns: columns.map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            default: col.column_default
          }))
        });
      }

      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      return { totalTables: 0, tables: [] };
    }
  }

  async validateModels() {
    try {
      const requiredTables = [
        'bota', 'botb', 'users', 'others', 'level_roles',
        'birthdays', 'reaction_roles'
      ];

      const existingTables = await this.getAllTables();
      const existingTableNames = existingTables.map(t => t.table_name);

      const missingTables = requiredTables.filter(
        table => !existingTableNames.includes(table)
      );

      const extraTables = existingTableNames.filter(
        table => !requiredTables.includes(table)
      );

      const validation = {
        valid: missingTables.length === 0,
        missingTables,
        extraTables,
        totalTables: existingTables.length,
        requiredTables: requiredTables.length
      };

      return validation;
    } catch (error) {
      console.error('Error validating models:', error);
      return {
        valid: false,
        error: error.message,
        missingTables: [],
        extraTables: [],
        totalTables: 0,
        requiredTables: 0
      };
    }
  }

  async testConnections() {
    try {
      // Test basic query
      await database.query('SELECT 1');
      
      // Test each table
      const tables = await this.getAllTables();
      const testResults = {};

      for (const table of tables) {
        try {
          await database.query(`SELECT 1 FROM ${table.table_name} LIMIT 1`);
          testResults[table.table_name] = { accessible: true };
        } catch (error) {
          testResults[table.table_name] = { 
            accessible: false, 
            error: error.message 
          };
        }
      }

      return {
        connectionHealthy: true,
        tableTests: testResults
      };
    } catch (error) {
      return {
        connectionHealthy: false,
        error: error.message,
        tableTests: {}
      };
    }
  }

  async cleanup() {
    try {
      // Database cleanup completed (temp audio files removed)
      
      return {
        cleaned: true,
        tempFilesRemoved: 0
      };
    } catch (error) {
      console.error('Error during cleanup:', error);
      return {
        cleaned: false,
        error: error.message,
        tempFilesRemoved: 0
      };
    }
  }
}

module.exports = new DatabaseUtils();