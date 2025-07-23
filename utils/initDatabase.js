const database = require("./database");

const createTables = async () => {
  try {
    console.log("Creating database tables...");

    // Create bota table
    await database.query(`
      CREATE TABLE IF NOT EXISTS bota (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) DEFAULT 'Heilos',
        age VARCHAR(50) DEFAULT '10',
        personality TEXT DEFAULT '',
        likes TEXT DEFAULT '',
        dislikes TEXT DEFAULT '',
        appearance TEXT DEFAULT '',
        backstory TEXT DEFAULT '',
        description TEXT DEFAULT '',
        others TEXT DEFAULT '',
        status VARCHAR(50) DEFAULT 'dnd',
        activity_text VARCHAR(255) DEFAULT 'Nothing',
        activity_type VARCHAR(50) DEFAULT 'streaming',
        allowed_channels TEXT DEFAULT '1',
        avatar_path TEXT DEFAULT '',
        blacklisted_users TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create botb table
    await database.query(`
      CREATE TABLE IF NOT EXISTS botb (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) DEFAULT 'Wisteria',
        age VARCHAR(50) DEFAULT '10',
        personality TEXT DEFAULT '',
        likes TEXT DEFAULT '',
        dislikes TEXT DEFAULT '',
        appearance TEXT DEFAULT '',
        backstory TEXT DEFAULT '',
        description TEXT DEFAULT '',
        others TEXT DEFAULT '',
        status VARCHAR(50) DEFAULT 'dnd',
        activity_text VARCHAR(255) DEFAULT 'Nothing',
        activity_type VARCHAR(50) DEFAULT 'streaming',
        allowed_channels TEXT DEFAULT '1',
        avatar_path TEXT DEFAULT '',
        blacklisted_users TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create users table
    await database.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        discord_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 0,
        last_xp_gain TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        conversation_history JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create others table (system settings) - optimized structure
    await database.query(`
      CREATE TABLE IF NOT EXISTS others (
        id SERIAL PRIMARY KEY,
        xp_enabled BOOLEAN DEFAULT true,
        min_xp INTEGER DEFAULT 2,
        max_xp INTEGER DEFAULT 8,
        xp_cooldown INTEGER DEFAULT 6,
        level_up_announcement BOOLEAN DEFAULT true,

        announcement_channel VARCHAR(255) DEFAULT '',

        
        auto_role_enabled BOOLEAN DEFAULT false,
        auto_role_ids TEXT DEFAULT '[]',
        
        forum_auto_react_enabled BOOLEAN DEFAULT false,
        forum_channels TEXT DEFAULT '[]',
        forum_emojis TEXT DEFAULT '[]',
        

        
        counting_enabled BOOLEAN DEFAULT false,
        counting_channel VARCHAR(255) DEFAULT NULL,
        counting_current INTEGER DEFAULT 0,
        counting_last_user VARCHAR(255) DEFAULT NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        thread_xp INTEGER DEFAULT 12,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
   `);

    // Create level_roles table
    await database.query(`
      CREATE TABLE IF NOT EXISTS level_roles (
        id SERIAL PRIMARY KEY,
        level INTEGER NOT NULL,
        role_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create birthdays table
    await database.query(`
      CREATE TABLE IF NOT EXISTS birthdays (
        id SERIAL PRIMARY KEY,
        discord_id VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        birth_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create reaction_roles table
    await database.query(`
      CREATE TABLE IF NOT EXISTS reaction_roles (
        id SERIAL PRIMARY KEY,
        message_id VARCHAR(255) NOT NULL,
        emoji VARCHAR(255) NOT NULL,
        role_id VARCHAR(255) NOT NULL,
        set_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create welcome_messages table
    await database.query(`
      CREATE TABLE IF NOT EXISTS welcome_messages (
        id SERIAL PRIMARY KEY,
        enabled BOOLEAN DEFAULT false,
        channel_id VARCHAR(255) DEFAULT '',
        message TEXT DEFAULT 'Welcome {user} to the server!',
        embed_enabled BOOLEAN DEFAULT false,
        embed_title TEXT DEFAULT 'Welcome!',
        embed_description TEXT DEFAULT 'Welcome to the server!',
        embed_color VARCHAR(7) DEFAULT '#0099ff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database tables created successfully!");

    // Insert default data if tables are empty
    await insertDefaultData();
  } catch (error) {
    console.error("Error creating database tables:", error);
    throw error;
  }
};

const insertDefaultData = async () => {
  try {
    // Check if bota has data
    const botaResult = await database.query("SELECT COUNT(*) FROM bota");
    if (parseInt(botaResult.rows[0].count) === 0) {
      await database.query(`
        INSERT INTO bota (name, age, status, activity_text, activity_type, allowed_channels)
        VALUES ('Heilos', '10', 'dnd', 'Nothing', 'streaming', '1')
      `);
      console.log("Inserted default BotA data");
    }

    // Check if botb has data
    const botbResult = await database.query("SELECT COUNT(*) FROM botb");
    if (parseInt(botbResult.rows[0].count) === 0) {
      await database.query(`
        INSERT INTO botb (name, age, status, activity_text, activity_type, allowed_channels)
        VALUES ('Wisteria', '10', 'dnd', 'Nothing', 'streaming', '1')
      `);
      console.log("Inserted default BotB data");
    }

    // Check if others has data
    const othersResult = await database.query("SELECT COUNT(*) FROM others");
    if (parseInt(othersResult.rows[0].count) === 0) {
      await database.query(`
        INSERT INTO others (
          xp_enabled, min_xp, max_xp, xp_cooldown, level_up_announcement,
          level_up_message, welcome_enabled, goodbye_enabled, auto_role_enabled,
          auto_role_ids, forum_auto_react_enabled, forum_auto_react_channels,
          forum_auto_react_emojis
        )
        VALUES (
          true, 2, 8, 6, true,
          'Congratulations {user}! You have reached level {level}!',
          false, false, false, '[]', false, '[]', '[]'
        )
      `);
      console.log("Inserted default Others data");
    }
  } catch (error) {
    console.error("Error inserting default data:", error);
  }
};

module.exports = { createTables, insertDefaultData };
