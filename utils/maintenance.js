#!/usr/bin/env node

const databaseUtils = require('./databaseUtils');
const serverUtils = require('./serverUtils');
const { checkDatabaseHealth, repairDatabase } = require('./checkDatabase');

async function runMaintenanceCheck() {
  console.log('🔧 Starting Discord Bot Maintenance Check...\n');
  
  try {
    // System Info
    console.log('📊 System Information:');
    const systemInfo = await serverUtils.getSystemInfo();
    console.log(`   Uptime: ${systemInfo.uptime.formatted}`);
    console.log(`   Memory: ${systemInfo.memory.heapUsed}MB used / ${systemInfo.memory.heapTotal}MB total`);
    console.log(`   Node.js: ${systemInfo.nodeVersion}`);
    console.log(`   Platform: ${systemInfo.platform} ${systemInfo.arch}\n`);

    // Environment Check
    console.log('🌐 Environment Configuration:');
    const envInfo = await serverUtils.getEnvironmentInfo();
    console.log(`   Database: ${envInfo.hasDatabase ? '✅ Connected' : '❌ Not configured'}`);
    console.log(`   Discord Tokens: ${envInfo.hasDiscordTokens ? '✅ Present' : '❌ Missing'}`);
    console.log(`   Google AI: ${envInfo.hasGoogleAI ? '✅ Present' : '❌ Missing'}`);
    console.log(`   Hugging Face: ${envInfo.hasHuggingFace ? '✅ Present' : '❌ Missing'}`);
    console.log(`   Environment: ${envInfo.nodeEnv}\n`);

    // Database Health Check
    console.log('🗄️ Database Health Check:');
    const dbHealth = await checkDatabaseHealth();
    if (dbHealth.healthy) {
      console.log('   ✅ Database is healthy');
      
      // Database Stats
      const dbStats = await databaseUtils.getDatabaseStats();
      console.log(`   📈 Total Tables: ${dbStats.totalTables}`);
      
      for (const table of dbStats.tables) {
        console.log(`   📋 ${table.name}: ${table.rowCount} rows, ${table.columnCount} columns`);
      }
    } else {
      console.log('   ❌ Database issues detected');
      console.log(`   Error: ${dbHealth.error}`);
    }
    console.log();

    // Model Validation
    console.log('🔍 Model Validation:');
    const validation = await databaseUtils.validateModels();
    if (validation.valid) {
      console.log('   ✅ All required tables present');
    } else {
      console.log('   ❌ Model validation failed');
      if (validation.missingTables.length > 0) {
        console.log(`   Missing tables: ${validation.missingTables.join(', ')}`);
      }
    }
    console.log();

    // Connection Tests
    console.log('🔗 Connection Tests:');
    const connectionTest = await databaseUtils.testConnections();
    if (connectionTest.connectionHealthy) {
      console.log('   ✅ Database connection healthy');
      
      const failedTables = Object.entries(connectionTest.tableTests)
        .filter(([_, test]) => !test.accessible)
        .map(([table, _]) => table);
      
      if (failedTables.length > 0) {
        console.log(`   ❌ Table access issues: ${failedTables.join(', ')}`);
      } else {
        console.log('   ✅ All tables accessible');
      }
    } else {
      console.log('   ❌ Database connection failed');
      console.log(`   Error: ${connectionTest.error}`);
    }
    console.log();

    // Cleanup
    console.log('🧹 Cleanup Tasks:');
    const cleanup = await databaseUtils.cleanup();
    if (cleanup.cleaned) {
      console.log(`   ✅ Cleanup completed - ${cleanup.tempFilesRemoved} temp files removed`);
    } else {
      console.log('   ❌ Cleanup failed');
      console.log(`   Error: ${cleanup.error}`);
    }
    console.log();

    // Final Status
    const overallHealthy = dbHealth.healthy && validation.valid && connectionTest.connectionHealthy;
    console.log('📋 Overall Status:');
    console.log(`   ${overallHealthy ? '✅ System is healthy' : '❌ Issues detected'}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
    
    if (!overallHealthy) {
      console.log('\n🔧 Suggested Actions:');
      if (!dbHealth.healthy) {
        console.log('   - Run database repair: node utils/maintenance.js --repair');
      }
      if (!validation.valid) {
        console.log('   - Check missing tables and run initialization');
      }
      if (!connectionTest.connectionHealthy) {
        console.log('   - Verify DATABASE_URL environment variable');
      }
    }

  } catch (error) {
    console.error('❌ Maintenance check failed:', error);
    process.exit(1);
  }
}

async function repairDatabaseAction() {
  console.log('🔧 Starting Database Repair...\n');
  
  try {
    const result = await repairDatabase();
    if (result.success) {
      console.log('✅ Database repair completed successfully');
    } else {
      console.log('❌ Database repair failed');
      console.log(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Database repair failed:', error);
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--repair')) {
    repairDatabaseAction();
  } else {
    runMaintenanceCheck();
  }
}

module.exports = {
  runMaintenanceCheck,
  repairDatabaseAction
};