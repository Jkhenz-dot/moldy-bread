#!/usr/bin/env node
/**
 * Production entry point for Render.com deployment
 * Optimized for stability and reconnection handling
 */

// Production environment setup
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Enhanced error handling for production
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception in production:', error);
  // Don't exit immediately in production, try to recover
  setTimeout(() => {
    console.log('Attempting to restart after uncaught exception...');
    restartApplication();
  }, 5000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in production:', promise, 'reason:', reason);
  // Log but don't crash in production
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
  
  console.log('Memory usage (MB):', mbUsed);
  
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

// Load main application
try {
  require('./index.js');
} catch (error) {
  console.error('Failed to start main application:', error);
  process.exit(1);
}