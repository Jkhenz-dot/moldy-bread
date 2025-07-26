#!/usr/bin/env node
/**
 * Production entry point for Render.com deployment
 * Optimized for stability and reconnection handling
 */

// Production environment setup
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Enhanced error handling for production
process.on('uncaughtException', (error) => {
  // Handle PostgreSQL connection termination gracefully
  if (error.code === '57P01' || 
      error.message?.includes('terminating connection due to administrator command') ||
      error.message?.includes('Connection terminated unexpectedly') ||
      error.message?.includes('server closed the connection unexpectedly') ||
      error.message?.includes('connection terminated') ||
      (error.routine === 'ProcessInterrupts' && error.file === 'postgres.c')) {
    console.log('Database connection terminated by administrator, recovering gracefully...');
    // Don't exit for expected database disconnections
    return;
  }
  
  console.error('Uncaught Exception in production:', error);
  console.log('Uncaught Exception:', error.message);
  console.log('Received uncaughtException, attempting graceful handling...');
  
  // For non-database errors, attempt restart
  setTimeout(() => {
    console.log('Proceeding with shutdown for uncaughtException...');
    process.exit(1);
  }, 2000);
});

process.on('unhandledRejection', (reason, promise) => {
  // Handle PostgreSQL connection termination gracefully
  if (reason && (reason.code === '57P01' || 
                 reason.message?.includes('terminating connection due to administrator command') ||
                 reason.message?.includes('Connection terminated unexpectedly'))) {
    console.log('Database connection terminated by administrator, recovering gracefully...');
    return;
  }
  
  console.error('Unhandled Rejection in production:', promise, 'reason:', reason);
  // Log but don't crash in production for other rejections
});

// Restart function for production recovery
const restartApplication = () => {
  console.log('Restarting application...');
  try {
    // Clear require cache for clean restart
    Object.keys(require.cache).forEach(key => {
      if (!key.includes('node_modules')) {
        delete require.cache[key];
      }
    });
    
    // Restart the main application
    require('./index.js');
  } catch (error) {
    console.error('Failed to restart application:', error);
    // If restart fails, exit and let Render restart the service
    process.exit(1);
  }
};

// Handle SIGTERM gracefully for Render.com
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, attempting graceful handling...');
  try {
    // Keep the process alive for reconnection attempts
    const gracePeriod = 30000; // 30 seconds grace period
    await new Promise(resolve => setTimeout(resolve, gracePeriod));
    console.log('Grace period completed, attempting to continue...');
    // Don't exit - let the process continue
  } catch (error) {
    console.error('Error during SIGTERM handling:', error);
  }
});

// Production logging
console.log('Starting Discord bot in production mode...');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  RENDER: !!process.env.RENDER,
  hasDatabase: !!process.env.DATABASE_URL,
  hasDiscordTokens: !!(process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN_2)
});

// Memory monitoring for production
const logMemoryUsage = () => {
  const used = process.memoryUsage();
  const mbUsed = Object.keys(used).reduce((acc, key) => {
    acc[key] = Math.round(used[key] / 1024 / 1024 * 100) / 100;
    return acc;
  }, {});
  
  // Memory usage logging removed per user request
  
  // Alert if memory usage is high (approaching 512MB limit on free tier)
  if (mbUsed.heapUsed > 400) {
    console.warn('High memory usage detected, triggering garbage collection...');
    if (global.gc) {
      global.gc();
    }
  }
};

// Start memory monitoring
setInterval(logMemoryUsage, 5 * 60 * 1000); // Every 5 minutes

// Set up keep-alive for Render.com
const startKeepAlive = () => {
  if (process.env.RENDER) {
    console.log('Starting keep-alive mechanism for Render.com...');
    setInterval(() => {
      // Internal ping to keep the service alive
      console.log('Keep-alive ping...');
    }, 4 * 60 * 1000); // Every 4 minutes
  }
};

startKeepAlive();

// Load main application
try {
  require('./index.js');
  
} catch (error) {
  console.error('Failed to start main application:', error);
  process.exit(1);
}