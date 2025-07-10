const fs = require('fs').promises;
const path = require('path');
const database = require('./database');

class ServerUtils {
  constructor() {
    this.startTime = Date.now();
  }

  getUptime() {
    const uptimeMs = Date.now() - this.startTime;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    
    return {
      milliseconds: uptimeMs,
      seconds: uptimeSeconds % 60,
      minutes: uptimeMinutes % 60,
      hours: uptimeHours % 24,
      days: Math.floor(uptimeHours / 24),
      formatted: this.formatUptime(uptimeHours, uptimeMinutes % 60, uptimeSeconds % 60)
    };
  }

  formatUptime(hours, minutes, seconds) {
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    return parts.join(' ') || '0s';
  }

  async getSystemInfo() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      uptime: this.getUptime(),
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100,
        rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid
    };
  }

  async getProjectStats() {
    try {
      const stats = {
        files: {},
        totalFiles: 0,
        totalSize: 0
      };

      const directories = ['models', 'utils', 'commands', 'server'];
      
      for (const dir of directories) {
        try {
          const dirPath = path.join(process.cwd(), dir);
          const dirStats = await this.getDirectoryStats(dirPath);
          stats.files[dir] = dirStats;
          stats.totalFiles += dirStats.fileCount;
          stats.totalSize += dirStats.totalSize;
        } catch (error) {
          stats.files[dir] = { fileCount: 0, totalSize: 0, error: error.message };
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting project stats:', error);
      return { error: error.message };
    }
  }

  async getDirectoryStats(dirPath) {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      let fileCount = 0;
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          const subDirStats = await this.getDirectoryStats(filePath);
          fileCount += subDirStats.fileCount;
          totalSize += subDirStats.totalSize;
        } else {
          fileCount++;
          try {
            const stat = await fs.stat(filePath);
            totalSize += stat.size;
          } catch (statError) {
            console.warn(`Could not get stats for ${filePath}:`, statError.message);
          }
        }
      }

      return { fileCount, totalSize };
    } catch (error) {
      return { fileCount: 0, totalSize: 0, error: error.message };
    }
  }

  async getEnvironmentInfo() {
    return {
      hasDatabase: !!process.env.DATABASE_URL,
      hasDiscordTokens: !!(process.env.DISCORD_TOKEN_1 && process.env.DISCORD_TOKEN_2),
      hasGoogleAI: !!process.env.GOOGLE_AI_KEY,
      hasHuggingFace: !!process.env.HF_TOKEN,
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000,
      guildId: process.env.GUILD_ID || 'not-set'
    };
  }

  async getDatabaseConnectionInfo() {
    try {
      const result = await database.query('SELECT version() as version');
      const connectionInfo = await database.query(`
        SELECT 
          usename as username,
          application_name,
          client_addr,
          state,
          query_start,
          state_change
        FROM pg_stat_activity 
        WHERE datname = current_database()
        AND pid = pg_backend_pid()
      `);

      return {
        connected: true,
        version: result.rows[0]?.version || 'Unknown',
        connectionDetails: connectionInfo.rows[0] || {}
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  async getFullSystemReport() {
    try {
      const [systemInfo, projectStats, environmentInfo, databaseInfo] = await Promise.all([
        this.getSystemInfo(),
        this.getProjectStats(),
        this.getEnvironmentInfo(),
        this.getDatabaseConnectionInfo()
      ]);

      return {
        timestamp: new Date().toISOString(),
        system: systemInfo,
        project: projectStats,
        environment: environmentInfo,
        database: databaseInfo
      };
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async cleanup() {
    try {
      const cleanupTasks = [];

      // Clean up temp files
      const tempPath = path.join(process.cwd(), 'temp');
      try {
        await fs.access(tempPath);
        const tempFiles = await fs.readdir(tempPath);
        for (const file of tempFiles) {
          const filePath = path.join(tempPath, file);
          const stats = await fs.stat(filePath);
          
          // Delete files older than 1 hour
          if (Date.now() - stats.mtime.getTime() > 3600000) {
            await fs.unlink(filePath);
            cleanupTasks.push(`Deleted temp file: ${file}`);
          }
        }
      } catch (error) {
        // Temp directory doesn't exist or is empty
      }

      // Clean up database temp files
      try {
        const dbCleanup = await database.query(`
          DELETE FROM temp_audio_files 
          WHERE expires_at < NOW()
          RETURNING file_path
        `);
        
        if (dbCleanup.rowCount > 0) {
          cleanupTasks.push(`Cleaned ${dbCleanup.rowCount} expired database records`);
        }
      } catch (error) {
        cleanupTasks.push(`Database cleanup failed: ${error.message}`);
      }

      return {
        success: true,
        tasksCompleted: cleanupTasks.length,
        tasks: cleanupTasks
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ServerUtils();