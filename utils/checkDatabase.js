const database = require("./database");
const { createTables } = require("./initDatabase");

const checkDatabaseHealth = async () => {
  try {
    // Test basic database connectivity
    await database.query("SELECT 1");

    // Check if all required tables exist
    const tableNames = [
      "bota",
      "botb",
      "users",
      "others",
      "level_roles",
      "birthdays",
      "reaction_roles",
      "welcome_messages",
    ];

    const missingTables = [];

    for (const tableName of tableNames) {
      try {
        await database.query(`SELECT 1 FROM ${tableName} LIMIT 1`);
      } catch (error) {
        if (error.code === "42P01") {
          // Table doesn't exist
          missingTables.push(tableName);
        }
      }
    }

    if (missingTables.length > 0) {
      console.log(`Missing tables detected: ${missingTables.join(", ")}`);
      console.log("Creating missing database tables...");
      await createTables();
      console.log("Database tables created successfully!");
    } else {
      console.log("All database tables exist and are accessible");
    }

    return {
      healthy: true,
      missingTables: missingTables,
      message: "Database is healthy",
    };
  } catch (error) {
    console.error("Database health check failed:", error);

    // If database is completely inaccessible, try to create tables
    if (
      error.code === "42P01" ||
      error.message.includes("relation") ||
      error.message.includes("does not exist")
    ) {
      console.log("Attempting to create database tables...");
      try {
        await createTables();
        return {
          healthy: true,
          missingTables: [],
          message: "Database tables created successfully",
        };
      } catch (createError) {
        console.error("Failed to create database tables:", createError);
        return {
          healthy: false,
          error: createError.message,
          message: "Failed to create database tables",
        };
      }
    }

    return {
      healthy: false,
      error: error.message,
      message: "Database connection failed",
    };
  }
};

const repairDatabase = async () => {
  try {
    console.log("Starting database repair...");

    // Drop and recreate all tables
    const tableNames = [
      "reaction_roles",
      "birthdays",
      "level_roles",
      "others",
      "users",
      "botb",
      "bota",
      "welcome_messages",
    ];

    // Drop tables in reverse order to handle dependencies
    for (const tableName of tableNames) {
      try {
        await database.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
        console.log(`Dropped table: ${tableName}`);
      } catch (error) {
        console.log(`Could not drop table ${tableName}:`, error.message);
      }
    }

    // Recreate all tables
    await createTables();
    console.log("Database repair completed successfully!");

    return {
      success: true,
      message: "Database repaired successfully",
    };
  } catch (error) {
    console.error("Database repair failed:", error);
    return {
      success: false,
      error: error.message,
      message: "Database repair failed",
    };
  }
};

module.exports = { checkDatabaseHealth, repairDatabase };
