// Core modules - loaded once and cached
const fs = require("fs");
const fsPromises = require("fs").promises; // Use promises for better async performance
const path = require("path");

const {
  Client,
  GatewayIntentBits,
  Collection,
  ActivityType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
} = require("discord.js");

// Database models - lazy loaded to improve startup time
let BotA, BotB, Others, Experience, UserData, LevelRoles, Birthday, ReactionRole, Reminder;
const loadDatabaseModels = () => {
  if (!BotA) {
    BotA = require("./models/postgres/BotA");
    BotB = require("./models/postgres/BotB");
    Others = require("./models/postgres/Others");
    Experience = require("./models/postgres/Experience");
    UserData = require("./models/postgres/UserData");
    LevelRoles = require("./models/postgres/LevelRoles");
    Birthday = require("./models/postgres/Birthday");
    ReactionRole = require("./models/postgres/ReactionRole");
    Reminder = require("./models/postgres/Reminder");
  }
  return {
    BotA,
    BotB,
    Others,
    Experience,
    UserData,
    LevelRoles,
    Birthday,
    ReactionRole,
    Reminder,
  };
};

// AI handler - lazy loaded
let generateAIResponse, cleanupCache;
const loadAIHandler = () => {
  if (!generateAIResponse) {
    const aiHandler = require("./utils/aiHandler");
    generateAIResponse = aiHandler.generateAIResponse;
    cleanupCache = aiHandler.cleanupCache;
  }
  return { generateAIResponse, cleanupCache };
};

// Environment configuration
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Start dashboard server asynchronously to avoid blocking bot startup
setImmediate(() => {
  try {
    require("./server");
  } catch (error) {
    console.error("Dashboard server failed to start:", error.message);
  }
});

// Cache configuration values
const ALLOWED_GUILDS = process.env.ALLOWED_GUILD_IDS?.split(",") || [];

// Optimized constants - cached at startup
const PASTEL_COLORS = Object.freeze([
  "#ffbec4ff",
  "#FFDFBA",
  "#FFFFBA",
  "#BAFFC9",
  "#BAE1FF",
  "#E1BAFF",
  "#ffbfeaff",
  "#B3E5D1",
  "#FFE5B3",
  "#E5B3FF",
  "#B3FFE5",
  "#FFE5E5",
  "#E5FFE5",
  "#E5E5FF",
  "#FFEEE5",
]);

// Optimized random color function
const getRandomPastelColor = () =>
  PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];

// Performance optimizations with automatic cleanup
const processedMessages = new Map(); // Store with timestamp for cleanup
const recentXPUsers = new Set(); // Track users who recently gained XP
const levelUpAnnouncements = new Set(); // Prevent duplicate level-up announcements
const processingUsers = new Set(); // Prevent concurrent XP processing for same user
const userLockTimes = new Map(); // Track when locks were created
const botConfigCache = new Map(); // Cache bot configurations
const userDataCache = new Map(); // Cache user data for faster access
const guildPermissionCache = new Map(); // Cache permission checks

// Auto-cleanup intervals for memory management
setInterval(
  () => {
    const now = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;

    // Clean old processed messages
    for (const [key, timestamp] of processedMessages.entries()) {
      if (now - timestamp > FIVE_MINUTES) {
        processedMessages.delete(key);
      }
    }

    // Level-up announcements are auto-cleaned by individual timeouts
    // No manual cleanup needed as each entry removes itself after 120 seconds

    // Force clear locks that are over 30 seconds old
    if (processingUsers.size > 0) {
      const now = Date.now();
      for (const userId of processingUsers) {
        const lockTime = userLockTimes.get(userId);
        if (lockTime && now - lockTime > 30000) {
          processingUsers.delete(userId);
          userLockTimes.delete(userId);
        }
      }
    }

    // Clean old user data cache
    for (const [key, data] of userDataCache.entries()) {
      if (now - data.lastAccessed > FIVE_MINUTES) {
        userDataCache.delete(key);
      }
    }

    // Clean permission cache
    for (const [key, data] of guildPermissionCache.entries()) {
      if (now - data.timestamp > FIVE_MINUTES) {
        guildPermissionCache.delete(key);
      }
    }
  },
  5 * 60 * 1000,
); // Run every 5 minutes

// Optimized client configuration - shared between both bots
const CLIENT_CONFIG = Object.freeze({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
  ],
  ws: {
    properties: { $browser: "Discord iOS" },
    compress: true, // Enable compression for better performance
    large_threshold: 100, // Reduce guild member fetch threshold
  },
  sweepers: {
    messages: {
      interval: 180000, // Clean up messages every 3 minutes (more frequent)
      lifetime: 900000, // Keep messages for 15 minutes (reduced from 30)
    },
    users: {
      interval: 600000, // Clean up users every 10 minutes
      filter: () => (user) => user.bot && user.id !== client.user.id, // Keep non-bot users
    },
    guildMembers: {
      interval: 600000, // Clean up guild members every 10 minutes
      filter: () => (member) =>
        member.user.bot && member.user.id !== client.user.id,
    },
  },
  partials: [], // Disable partials for better performance
  allowedMentions: {
    parse: ["users", "roles"],
    repliedUser: false, // Don't ping when replying
  },
});

// Create optimized bot clients
const client1 = new Client(CLIENT_CONFIG);
const client2 = new Client(CLIENT_CONFIG);

// Set bot identifiers
client1.botId = "bot1";
client2.botId = "bot2";

global.discordClient1 = client1;
global.discordClient2 = client2;
global.discordClient = client1; // Default for backward compatibility

client1.commands = new Collection();
client2.commands = new Collection();

// Load commands for both bots
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client1.commands.set(command.data.name, command);
  client2.commands.set(command.data.name, command);
}

// Initialize reaction roles when bot starts
const initializeReactionRoles = async () => {
  try {
    const { ReactionRole } = loadDatabaseModels();
    const reactionRoles = await ReactionRole.getAllReactionRoles();

    if (reactionRoles && reactionRoles.length > 0) {
      console.log(
        `Found ${reactionRoles.length} reaction role configurations to initialize`,
      );

      // Group by message ID to ensure all reactions are properly added
      const messageGroups = {};
      reactionRoles.forEach((role) => {
        if (!messageGroups[role.message_id]) {
          messageGroups[role.message_id] = [];
        }
        messageGroups[role.message_id].push(role);
      });

      // Process each message
      for (const [messageId, roles] of Object.entries(messageGroups)) {
        try {
          // Find the message in all guilds
          let foundMessage = null;
          for (const guild of client1.guilds.cache.values()) {
            for (const channel of guild.channels.cache.values()) {
              if (channel.isTextBased()) {
                try {
                  foundMessage = await channel.messages.fetch(messageId);
                  if (foundMessage) break;
                } catch (error) {
                  // Message not in this channel, continue
                  continue;
                }
              }
            }
            if (foundMessage) break;
          }

          if (foundMessage) {
            // Check and add missing reactions
            for (const role of roles) {
              const emoji = role.emoji_id;
              const existingReaction = foundMessage.reactions.cache.find(
                (r) => {
                  const reactionEmoji = r.emoji.id
                    ? `<:${r.emoji.name}:${r.emoji.id}>`
                    : r.emoji.name;
                  return reactionEmoji === emoji;
                },
              );

              if (!existingReaction) {
                try {
                  await foundMessage.react(emoji);
                  // Reaction added to message
                } catch (error) {
                  console.error(
                    `Failed to add reaction ${emoji} to message ${messageId}:`,
                    error,
                  );
                }
              }
            }
          } else {
            // Message not found - cleaning up orphaned reaction role sets

            try {
              // Get unique set IDs for this message
              const setIds = [...new Set(roles.map((role) => role.set_id))];

              for (const setId of setIds) {
                const deletedCount = await ReactionRole.deleteBySetId(setId);
                // Reaction role set deleted due to missing message
              }
            } catch (deleteError) {
              console.error(
                `Failed to delete orphaned reaction role sets for message ${messageId}:`,
                deleteError,
              );
            }
          }
        } catch (error) {
          console.error(
            `Error processing reaction roles for message ${messageId}:`,
            error,
          );
        }
      }

      // Reaction roles initialization completed
    } else {
      // No reaction roles found to initialize
    }
  } catch (error) {
    console.error("Error initializing reaction roles:", error);
  }
};

// PostgreSQL database initialization and dashboard sync
const initializeDashboardData = async () => {
  try {
    // Test database connection using BaseModel
    const { BotA } = loadDatabaseModels();
    await BotA.findOne(); // This will test the connection
    console.log("PostgreSQL connected");

    // Ensure bot data exists and is properly structured
    let botAData = await BotA.findOne();
    if (!botAData) {
      console.log("Creating initial BotA configuration...");
      botAData = await BotA.create({});
    }

    let botBData = await BotB.findOne();
    if (!botBData) {
      console.log("Creating initial BotB configuration...");
      botBData = await BotB.create({});
    }

    let othersData = await Others.findOne();
    if (!othersData) {
      console.log("Creating initial Others configuration...");
      othersData = await Others.create({});
    }
    let experienceData = await Experience.findOne();
    if (!experienceData) {
      console.log("Creating initial Experience configuration...");
      experienceData = await Experience.create({});
    }

    // Sync dashboard data on startup
    global.dashboardData = {
      bot1Config: BotA || {},
      bot2Config: BotB || {},
      xpSettings: experienceData || {},
      forumAutoReact: { enabled: false },
      counting: { enabled: false },
      stats: { interactions: 0, commands: 0 },
    };

    console.log("Dashboard data synchronized with database");

    // Initialize reminder table
    const { Reminder } = loadDatabaseModels();
    await Reminder.createTable();

    // Initialize reaction roles will be called after both bots are ready
  } catch (error) {
    console.log("PostgreSQL unavailable:", error.message);
  }
};

// Function to sync dashboard changes back to database
const syncDashboardToDatabase = async (updatedData) => {
  try {
    // Update BotA data
    if (updatedData.bot1Config) {
      await BotA.findOneAndUpdate({}, updatedData.bot1Config, { upsert: true });
    }

    // Update BotB data
    if (updatedData.bot2Config) {
      await BotB.findOneAndUpdate({}, updatedData.bot2Config, { upsert: true });
    }

    // Update Experience data
    if (updatedData.xpSettings) {
      await Experience.findOneAndUpdate({}, updatedData.xpSettings, {
        upsert: true,
      });
    }

    // Update global dashboard data
    global.dashboardData = { ...global.dashboardData, ...updatedData };
    console.log("Dashboard data synchronized to database");
  } catch (error) {
    console.error("Failed to sync dashboard data to database:", error);
  }
};

// Make sync function globally available
global.syncDashboardToDatabase = syncDashboardToDatabase;

initializeDashboardData();

const badWords = ["badword1", "badword2"];
const isNSFW = (content) =>
  badWords.some((word) => content.toLowerCase().includes(word));

const calculateLevel = (xp) => {
  if (xp === 0) return 0; // Start at level 0

  let currentXP = 0;
  let level = 0; // Start counting from level 0

  while (true) {
    const tierMultiplier = 1 + Math.floor(level / 5) * 0.21;
    let xpNeeded;

    if (level === 0) {
      xpNeeded = 1; // Level 1 requires just 1 XP from level 0 (first message)
    } else {
      xpNeeded = Math.pow(level, 2) * 100 * tierMultiplier;
    }

    if (currentXP + xpNeeded > xp) break;
    currentXP += xpNeeded;
    level++;
  }

  return level;
};


// XP is only handled by Bot 1
const addXP = async (userId, message = null, xp = 1, source = "default") => {
  let lockTimeout = null; // Declare outside try block for finally access
  try {
    // Check if user recently gained XP to avoid spam
    const userCooldownKey = `${userId}`;
    if (recentXPUsers.has(userCooldownKey)) return;

    // Prevent concurrent processing for the same user with stronger locking
    const processingKey = `${userId}`;
    if (processingUsers.has(processingKey)) {
      return; // Exit immediately if already processing
    }

    // Lock this user for processing
    processingUsers.add(processingKey);
    userLockTimes.set(processingKey, Date.now());

    // Auto-release lock after 10 seconds to prevent permanent locks
    lockTimeout = setTimeout(() => {
      processingUsers.delete(processingKey);
      userLockTimes.delete(processingKey);
    }, 10000);

    // Cache experience data to avoid repeated database calls
    const cacheKey = "experienceData";
    let experienceData;
    if (botConfigCache.has(cacheKey)) {
      experienceData = botConfigCache.get(cacheKey);
    } else {
      experienceData = await Experience.findOne();
      if (!experienceData) return;
      botConfigCache.set(cacheKey, experienceData);
      setTimeout(() => botConfigCache.delete(cacheKey), 60000); // Cache for 1 minute
    }

    // Always fetch fresh user data from database to prevent cache conflicts

    let user = await UserData.findOne({ discord_id: userId });
    if (!user) {
      const guildId = message?.guildId;
      const guild = guildId ? client1.guilds.cache.get(guildId) : null;
      let member = guild?.members.cache.get(userId);

      // If member not in cache, try to fetch from Discord API
      if (!member && guild) {
        try {
          member = await guild.members.fetch(userId);
        } catch (error) {
          console.log(`Could not fetch member ${userId}: ${error.message}`);
        }
      }

      const username =
        member?.user?.username ||
        member?.displayName ||
        `User_${userId.oesslice(-4)}`;


      // Use upsert to handle duplicate key errors gracefully
      user = await UserData.findOneAndUpdate(
        { discord_id: userId },
        {
          discord_id: userId,
          username,
          xp: 0,
          level: 0,
          last_xp_gain: new Date(),
        },
        { upsert: true },
      );
    }

    // Check if user is null (database error)
    if (!user) {
      console.error(`Failed to create/find user ${userId}`);
      return;
    }

    // Fix missing usernames for existing users
    if (!user.username || user.username === "" || user.username === "Unknown") {
      const guildId = message?.guildId;
      const guild = guildId ? client1.guilds.cache.get(guildId) : null;
      let member = guild?.members.cache.get(userId);

      if (!member && guild) {
        try {
          member = await guild.members.fetch(userId);
        } catch (error) {
          // Could not fetch member for username update
        }
      }

      if (member?.user?.username) {
        const newUsername =
          member.user.username ||
          member.displayName ||
          `User_${userId.slice(-4)}`;
        // Username updated silently

        user = await UserData.findOneAndUpdate(
          { discord_id: userId },
          { username: newUsername },
          { upsert: false },
        );
      }
    }

    if (
      user.last_xp_gain &&
      Date.now() - new Date(user.last_xp_gain) <
        (experienceData.xp_cooldown || 70000)
    ) {
      // Add to cooldown set to prevent repeated checks
      recentXPUsers.add(userCooldownKey);
      setTimeout(
        () => recentXPUsers.delete(userCooldownKey),
        experienceData.xp_cooldown || 70000,
      );
      return;
    }

    const oldLevel = user.level;
    const minXp = experienceData.min_xp || 1;
    const maxXp = experienceData.max_xp || 15;
    let randomXp = Math.floor(Math.random() * (maxXp - minXp + 1)) + minXp;

    // Apply XP modifiers based on message content
    if (message) {
      const hasAttachments =
        message.attachments && message.attachments.size > 0;
      const content = message.content.trim();

      // Check for URLs in the message
      const hasUrl = /https?:\/\/[^\s]+/.test(content);

      // Check if message is emoji-only (including Unicode emojis and Discord custom emojis)
      const isEmojiOnly =
        content.length > 0 &&
        // Discord custom emojis
        (/^<a?:[a-zA-Z0-9_]+:[0-9]+>$/.test(content) ||
          // Simple emoji detection - check if message is very short and contains common emojis
          (content.length <= 8 && /[\u{1F600}-\u{1F64F}]/u.test(content)) ||
          // Basic emoji check for common emojis without problematic ranges
          (content.length <= 5 &&
            /[😀😃😄😁😆😅😂🤣😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🤩🥳😏😒😞😔😟😕🙁☹️😣😖😫😩🥺😢😭😤😠😡🤬🤯😳🥵🥶😱😨😰😥😓🤗🤔🤭🤫🤥😶😐😑😬🙄😯😦😧😮😲🥱😴🤤😪😵🤐🥴🤢🤮🤧😷🤒🤕🤑🤠]/u.test(
              content,
            )));

      if (isEmojiOnly) {
        // -1 XP for emoji-only messages
        randomXp = randomXp - 1;
        // XP penalty applied for emoji-only message
      } else if (content.length === 1) {
        // -1 XP for single character messages
        randomXp = randomXp - 1;
        // XP penalty applied for single character message
      } else if (hasUrl && content.split(' ').length === 1) {
        // -1 XP for messages that are just a link
        randomXp = randomXp - 1;
        // XP penalty applied for link-only message
      }
      
     randomXp = randomXp - 1;
    }

    const newXp = user.xp + randomXp;
    const newLevel = calculateLevel(newXp);

    user = await UserData.findOneAndUpdate(
      { discord_id: userId },
      {
        xp: newXp,
        level: newLevel,
        last_xp_gain: new Date(),
      },
      { upsert: true },
    );

    // Simple duplicate prevention using user-level combination
    const announcementKey = `${userId}-${newLevel}`;

    // Check if this user+level combination was already announced
    if (levelUpAnnouncements.has(announcementKey)) {
      return { levelUp: false, alreadyAnnounced: true };
    }

    // Only announce actual level increases - never re-announce same level
    const actualLevelUp = newLevel > oldLevel;

    // Announce when user actually levels up (including 0->1 and any higher level ups)
    if (actualLevelUp && othersData?.level_up_announcement) {
      // Mark this announcement to prevent duplicates BEFORE sending
      levelUpAnnouncements.add(announcementKey);
      // Level-up announcement marked

      // For level 1, never remove the lock to prevent re-announcements
      // For higher levels, remove after 120 seconds to allow re-announcements if needed
      if (newLevel === 1) {
        // Level 1 announcement permanently locked
      } else {
        setTimeout(() => {
          levelUpAnnouncements.delete(announcementKey);
          // Level-up announcement lock removed
        }, 120000);
      }
      const guildId = message?.guildId;
      const guild = guildId ? client1.guilds.cache.get(guildId) : null;
      if (guild) {
        const member = guild.members.cache.get(userId);
        if (member) {
          // Get all level roles that user qualifies for
          const allLevelRoles = await LevelRoles.find();
          const levelRoles = allLevelRoles
            .filter((lr) => lr.level <= newLevel)
            .sort((a, b) => b.level - a.level);
          for (const levelRole of levelRoles) {
            const role = guild.roles.cache.get(levelRole.roleId);
            if (role && !member.roles.cache.has(role.id)) {
              await member.roles.add(role);
            }
          }

          let announcementChannel = null;
          if (othersData.announcement_channel) {
            announcementChannel = guild.channels.cache.get(
              othersData.announcement_channel,
            );
          }

          if (!announcementChannel) {
            announcementChannel = guild.channels.cache.find(
              (channel) =>
                channel.type === ChannelType.GuildText &&
                channel
                  .permissionsFor(guild.members.me)
                  .has(["SendMessages", "ViewChannel"]),
            );
          }

          if (announcementChannel) {
            // Generate AI congratulation message
            let congratulationMessage = "Congratulations on your level up!";
            try {
              const { GoogleGenerativeAI } = require("@google/generative-ai");
              const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
              const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
              });

              const prompt = `Generate a short celebratory congratulation message for someone leveling up in a Discord server. Keep it under 40 characters, make it encouraging. Just return the message, nothing else.Emojis not allowed`;

              const result = await model.generateContent(prompt);
              const response = await result.response;
              const text = response.text();

              if (text && text.trim().length <= 40) {
                congratulationMessage = text.trim();
              }
            } catch (error) {
              console.log(
                "AI congratulation generation failed, using fallback",
              );
            }

            // Different messages for first-time level 1 vs regular level ups
            const isWelcomeMessage = oldLevel === 0 && newLevel === 1;
            const embedTitle = "<:_celebrate:1206495792777531442> Level Up!";
            const embedDescription = isWelcomeMessage
              ? `${member} just started chatting and reached **Level 1**!\n\n*${congratulationMessage}*\n\n\n`
              : `${member} has reached **Level ${newLevel}**!\n\n*${congratulationMessage}*\n\n\n`;

            const levelEmbed = new EmbedBuilder()
              .setTitle(embedTitle)
              .setDescription(embedDescription)
              .setColor(getRandomPastelColor())
              .setThumbnail(member.user.displayAvatarURL())
              .setTimestamp();

            // Randomly choose between bot1 and bot2 to send the message (50/50)
            const useBot1 = Math.random() < 0.5;
            let messageSent = false;

            if (useBot1 && client1) {
              try {
                const bot1Channel = client1.channels.cache.get(
                  announcementChannel.id,
                );
                if (bot1Channel) {
                  await bot1Channel.send({ embeds: [levelEmbed] });
                  messageSent = true;
                }
              } catch (error) {
                // Bot 1 failed, trying Bot 2
              }
            }

            // If Bot 1 failed or we chose Bot 2, try Bot 2
            if (!messageSent && client2) {
              try {
                const bot2Channel = client2.channels.cache.get(
                  announcementChannel.id,
                );
                if (bot2Channel) {
                  await bot2Channel.send({ embeds: [levelEmbed] });
                  messageSent = true;
                }
              } catch (error) {
                // Bot 2 failed, using fallback
              }
            }

            // Fallback to original method if both bots failed
            if (!messageSent) {
              await announcementChannel.send({ embeds: [levelEmbed] });
            }
          }
        }
      }
      return { levelUp: true, newLevel: user.level };
    }

    // Always update top 5 roles after XP gain
    if (message?.guildId) {
      await updateTop5Roles(message.guildId);
    }
  } catch (e) {
    console.error("XP error:", e);
  } finally {
    // Always unlock the user after processing
    const processingKey = `${userId}`;  // Simplified key without guildId
    processingUsers.delete(processingKey);
    // Clear the timeout to prevent memory leak
    if (lockTimeout) {
      clearTimeout(lockTimeout);
    }
  }
};

// Setup ready event for both bots
const setupBot = async (client, botToken, botName) => {
  client.once("ready", async () => {
    console.log(`${client.user.tag} online`);

    // Check bot permissions in all guilds
    for (const guild of client.guilds.cache.values()) {
      const member = guild.members.me;
      if (member) {
        const hasAdmin = member.permissions.has("Administrator");
        const missingPerms = [];

        // Check essential permissions
        const requiredPerms = [
          "SendMessages",
          "ViewChannel",
          "ReadMessageHistory",
          "ManageRoles",
          "ManageMessages",
          "AddReactions",
          "UseSlashCommands",
          "EmbedLinks",
        ];

        requiredPerms.forEach((perm) => {
          if (!member.permissions.has(perm)) {
            missingPerms.push(perm);
          }
        });

        if (hasAdmin) {
          // Bot has Administrator permission
        } else if (missingPerms.length > 0) {
          console.warn(
            `${botName} missing permissions in ${guild.name}:`,
            missingPerms.join(", "),
          );
        } else {
          // Bot has sufficient permissions
        }
      }
    }

    const commands = client.commands.map((command) => command.data);

    try {
      const { REST, Routes } = require("discord.js");
      const rest = new REST().setToken(botToken);
      await rest.put(Routes.applicationCommands(client.user.id), {
        body: commands,
      });
      console.log(`Slash commands registered for ${botName}`);
    } catch (e) {
      console.error(`Command registration failed for ${botName}:`, e);
      if (e.message.includes("Missing Permissions")) {
        console.error(
          `${botName} needs application.commands permission in Discord Developer Portal`,
        );
      }
    }

    // Start reminder service only for the first bot to avoid duplicates
    if (botName === "Bot1") {
      try {
        const ReminderService = require('./utils/reminderService');
        const reminderService = new ReminderService(client);
        reminderService.start();
        console.log('Reminder service initialized');
      } catch (error) {
        console.error('Failed to start reminder service:', error);
      }
    }

    try {
      // Load database models before use
      const { BotA, BotB } = loadDatabaseModels();

      let botConfig;
      if (client.botId === "bot1") {
        botConfig = await BotA.findOne();
        if (!botConfig) {
          botConfig = await BotA.create({});
        }
      } else {
        botConfig = await BotB.findOne();
        if (!botConfig) {
          botConfig = await BotB.create({});
        }
      }
      // Parse allowed_channels to array format
      if (botConfig && botConfig.allowed_channels) {
        if (typeof botConfig.allowed_channels === "string") {
          // If it's a single channel ID, convert to array
          if (botConfig.allowed_channels.length > 0) {
            botConfig.allowed_channels = [botConfig.allowed_channels];
          } else {
            botConfig.allowed_channels = [];
          }
        }
      }

      client.botConfig = botConfig;

      if (botConfig) {
        // Set presence properly with database configuration
        const presenceData = {
          status: botConfig.status || "online",
          activities: [],
        };

        // Use correct database field names
        const activityText = botConfig.activity_text;
        const activityType = botConfig.activity_type || "playing";

        if (activityText) {
          const activity = {
            name: activityText,
            type:
              ActivityType[
                activityType.charAt(0).toUpperCase() + activityType.slice(1)
              ] || ActivityType.Playing,
          };

          // Handle streaming activity type
          if (activityType === "streaming") {
            activity.url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
          }

          presenceData.activities.push(activity);
        }

        // Apply status from database configuration
        await client.user.setPresence(presenceData);
        console.log(
          `${botName} presence set from database: ${presenceData.status}, activity: ${activityText || "none"} (${activityType})`,
        );
      }
    } catch (e) {
      console.error(`Bot data setup failed for ${botName}:`, e);
      client.botConfig = {
        name: client.botId === "bot1" ? "Heilos" : "Wisteria",
        status: "online",
        activityText: "",
        activityType: "playing",
        personality: "helpful",
        allowedChannels: "",
      };
    }

    for (const guild of client1.guilds.cache.values()) {
      await updateTop5Roles(guild.id);
    }
    console.log('Top 5 XP roles assigned on startup');
  });

  // Guild Member Add handler (Welcomer and Auto Role)
  client.on("guildMemberAdd", async (member) => {
    if (ALLOWED_GUILDS.length > 0 && !ALLOWED_GUILDS.includes(member.guild.id))
      return;

    try {
      const othersData = await Others.findOne();
      if (!othersData) return;

      // Auto Role Assignment
      if (othersData.auto_role_enabled && othersData.auto_role_ids) {
        const roleIds = othersData.auto_role_ids
          .split(",")
          .filter((id) => id.trim());

        for (const roleId of roleIds) {
          try {
            const role = member.guild.roles.cache.get(roleId.trim());
            if (role && !member.roles.cache.has(role.id)) {
              await member.roles.add(role);
              console.log(
                `Assigned role ${role.name} to ${member.user.username}`,
              );
            }
          } catch (error) {
            console.error(
              `Failed to assign role ${roleId} to ${member.user.username}:`,
              error.message,
            );
          }
        }
      }

      // Welcome Message - using new WelcomeMessage table
      const WelcomeMessage = require("./models/postgres/WelcomeMessage");
      const welcomeMessageData = await WelcomeMessage.findOne();

      if (
        welcomeMessageData &&
        welcomeMessageData.enabled &&
        welcomeMessageData.channel_id
      ) {
        const welcomeChannel = member.guild.channels.cache.get(
          welcomeMessageData.channel_id,
        );
        if (welcomeChannel && welcomeChannel.isTextBased()) {
          const userMention = `<@${member.user.id}>`;

          if (welcomeMessageData.embed_enabled) {
            // Send rich embed welcome message
            const embed = new EmbedBuilder()
              .setTitle(welcomeMessageData.embed_title || "Welcome!")
              .setDescription(
                (
                  welcomeMessageData.embed_description ||
                  "Welcome to our server, {user}! We're glad you're here."
                ).replace("{user}", userMention),
              )
              .setColor(welcomeMessageData.embed_color || "#7c3aed")
              .setFooter({
                text: welcomeMessageData.embed_footer || "Have a great time!",
              })
              .setTimestamp();

            if (welcomeMessageData.embed_thumbnail !== false) {
              embed.setThumbnail(
                member.user.displayAvatarURL({ dynamic: true }),
              );
            }

            await welcomeChannel.send({ embeds: [embed] });
          } else {
            // Send plain text welcome message
            const welcomeMessage = (
              welcomeMessageData.message || "Welcome to the server, {user}!"
            ).replace("{user}", userMention);
            await welcomeChannel.send(welcomeMessage);
          }

          console.log(
            `Sent welcome message for ${member.user.username} in ${member.guild.name}`,
          );
        }
      }
    } catch (error) {
      console.error("Error in guildMemberAdd handler:", error);
    }
  });

  // Interaction handler
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand() && !interaction.isButton()) return;
    if (
      ALLOWED_GUILDS.length > 0 &&
      !ALLOWED_GUILDS.includes(interaction.guildId)
    )
      return;

    if (interaction.isButton()) {
      if (interaction.customId.startsWith("delete_")) {
        const messageOwnerId = interaction.customId.split("_")[2];
        if (interaction.user.id === messageOwnerId) {
          await interaction.message.delete();
          const embed = new EmbedBuilder()
            .setTitle("Deleted")
            .setDescription("Message deleted")
            .setColor(0x00ff00);
          await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
          });
        } else {
          const embed = new EmbedBuilder()
            .setTitle("Access Denied")
            .setDescription("Only the original user can delete this message")
            .setColor(0xff0000);
          await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      if (interaction.customId.startsWith("music_")) {
        const queue = interaction.client.musicQueue?.get(interaction.guildId);
        if (!queue) return;

        if (interaction.customId === "music_toggle") {
          const { AudioPlayerStatus } = require("@discordjs/voice");
          if (queue.player.state.status === AudioPlayerStatus.Playing) {
            queue.player.pause();
          } else {
            queue.player.unpause();
          }
          await interaction.deferUpdate();
        }

        if (interaction.customId === "music_prev" && queue.currentIndex > 0) {
          queue.currentIndex--;
          const command = client.commands.get("vc-play");
          if (command) await command.playSong(queue, interaction);
          await interaction.deferUpdate();
        }

        if (
          interaction.customId === "music_next" &&
          queue.currentIndex < queue.songs.length - 1
        ) {
          queue.currentIndex++;
          const command = client.commands.get("vc-play");
          if (command) await command.playSong(queue, interaction);
          await interaction.deferUpdate();
        }

        if (interaction.customId === "music_stop") {
          queue.songs = [];
          queue.currentSong = null;
          queue.isPlaying = false;
          queue.currentIndex = 0;
          queue.player.stop();
          await interaction.deferUpdate();
        }
      }

      return;
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    // Check channel restrictions for slash commands
    try {
      const botConfig = client.botConfig || {};
      const othersData = await Others.findOne();

      // Check if we're in a counting channel (no commands allowed except counting rules)
      if (
        othersData?.counting_enabled &&
        othersData.counting_channel === interaction.channelId
      ) {
        const embed = new EmbedBuilder()
          .setTitle("Counting Channel")
          .setDescription(
            `No commands are allowed in the counting channel. This channel is for counting only.`,
          )
          .setColor(0xff0000);

        return await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      }

      // Commands that work in all channels (no restrictions)
      const globalCommands = ["purge"];

      // VC commands require both voice channel AND allowed channel restrictions
      const vcCommands = ["vc-join", "vc-play", "vc-add", "vc-disconnect"];

      if (vcCommands.includes(interaction.commandName)) {
        // Check if user is in voice channel
        if (!interaction.member?.voice?.channel) {
          const embed = new EmbedBuilder()
            .setTitle("Voice Channel Required")
            .setDescription(
              `You must be in a voice channel to use this command.`,
            )
            .setColor(0xff0000);

          return await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
          });
        }

        // Get bot configuration for channel restrictions
        const { BotA, BotB } = loadDatabaseModels();
        let botConfig = {};
        try {
          if (client.botId === "bot1") {
            botConfig = (await BotA.findOne()) || {};
          } else if (client.botId === "bot2") {
            botConfig = (await BotB.findOne()) || {};
          }
        } catch (error) {
          console.error(
            "Error loading bot config for channel restrictions:",
            error,
          );
          botConfig = {};
        }

        // Also check if VC command is allowed in this channel
        const allowedChannels = botConfig?.allowed_channels || [];
        if (allowedChannels.length > 0) {
          if (!allowedChannels.includes(interaction.channelId)) {
            const embed = new EmbedBuilder()
              .setTitle("Channel Restricted")
              .setDescription(
                `Voice commands can only be used in allowed channels. Contact an administrator to configure channel permissions.`,
              )
              .setColor(0xff0000);

            return await interaction.reply({
              embeds: [embed],
              flags: MessageFlags.Ephemeral,
            });
          }
        }
      } else if (!globalCommands.includes(interaction.commandName)) {
        // Get bot configuration for channel restrictions
        const { BotA, BotB } = loadDatabaseModels();
        let botConfig = {};
        try {
          if (client.botId === "bot1") {
            botConfig = (await BotA.findOne()) || {};
          } else if (client.botId === "bot2") {
            botConfig = (await BotB.findOne()) || {};
          }
        } catch (error) {
          console.error(
            "Error loading bot config for channel restrictions:",
            error,
          );
          botConfig = {};
        }

        // All other commands check allowed channels
        const allowedChannels = botConfig?.allowed_channels || [];
        if (allowedChannels.length > 0) {
          if (!allowedChannels.includes(interaction.channelId)) {
            const embed = new EmbedBuilder()
              .setTitle("Channel Restricted")
              .setDescription(
                `This command can only be used in allowed channels. Contact an administrator to configure channel permissions.`,
              )
              .setColor(0xff0000);

            return await interaction.reply({
              embeds: [embed],
              flags: MessageFlags.Ephemeral,
            });
          }
        }
      }
    } catch (error) {
      console.error("Channel restriction check error:", error);
    }

    try {
      // Award XP for using slash commands from either bot (but only processed by bot1)
      if (client.botId === "bot1") {
        try {
          const Experience = require("./models/postgres/Experience");
          const UserData = require("./models/postgres/UserData");
          const experienceData = await Experience.findOne();
          const slashXp = experienceData?.slash_xp || 0;
          
          if (slashXp > 0) {
            let userData = await UserData.findOne({ discord_id: interaction.user.id });
            if (!userData) {
              userData = await UserData.create({
                discord_id: interaction.user.id,
                username: interaction.user.username,
                xp: 0,
                level: 0
              });
            }
            
            const newXP = (userData.xp || 0) + slashXp;
            const newLevel = calculateLevel(newXP);
            
            await UserData.findOneAndUpdate(
              { discord_id: interaction.user.id },
              { xp: newXP, level: newLevel },
              { upsert: true }
            );
          }
        } catch (error) {
          console.error("Error awarding slash command XP:", error);
        }
      }

      await command.execute(interaction, client);
    } catch (error) {
      console.error(`Discord client error: ${error}`);

      let errorMessage = "Command execution failed";
      let errorTitle = "Error";

      // Handle specific permission errors
      if (
        error.message.includes("Missing Permissions") ||
        error.code === 50013
      ) {
        errorTitle = "Missing Permissions";
        errorMessage =
          "I don't have the required permissions to execute this command. Please ensure I have Administrator permission or the specific permissions needed.";
      } else if (
        error.message.includes("Missing Access") ||
        error.code === 50001
      ) {
        errorTitle = "Missing Access";
        errorMessage =
          "I don't have access to perform this action. Please check my role permissions and channel access.";
      } else if (
        error.message.includes("Cannot send messages") ||
        error.code === 50007
      ) {
        errorTitle = "Cannot Send Messages";
        errorMessage =
          "I cannot send messages to this channel. Please check my permissions.";
      } else if (
        error.message.includes("Unknown Channel") ||
        error.code === 10003
      ) {
        errorTitle = "Channel Not Found";
        errorMessage =
          "The specified channel was not found or I don't have access to it.";
      }

      // Handle interaction timeout specifically
      if (
        error.code === 10062 ||
        error.message.includes("Unknown interaction")
      ) {
        console.log("Interaction expired - command took too long to respond");
        return; // Can't reply to expired interactions
      }

      if (!interaction.replied && !interaction.deferred) {
        const embed = new EmbedBuilder()
          .setTitle(errorTitle)
          .setDescription(errorMessage)
          .setColor(0xff0000)
          .setFooter({
            text: "Contact an administrator if this issue persists",
          });

        try {
          await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
          });
        } catch (replyError) {
          if (replyError.code === 10062) {
            console.log("Failed to reply - interaction already expired");
          } else {
            console.log("Failed to send error reply:", replyError.message);
          }
        }
      } else if (interaction.deferred && !interaction.replied) {
        // Try to edit the deferred reply
        try {
          const embed = new EmbedBuilder()
            .setTitle(errorTitle)
            .setDescription(errorMessage)
            .setColor(0xff0000);

          await interaction.editReply({ embeds: [embed] });
        } catch (editError) {
          if (editError.code === 10062) {
            console.log("Failed to edit reply - interaction already expired");
          } else {
            console.log("Failed to edit deferred reply:", editError.message);
          }
        }
      }
    }
  });

  // Message handler
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (ALLOWED_GUILDS.length > 0 && !ALLOWED_GUILDS.includes(message.guildId))
      return;

    // Get bot configuration for channel restrictions
    const currentBotConfig = client.botConfig || {};
    const { Others } = loadDatabaseModels();
    const othersData = await Others.findOne();

    if (isNSFW(message.content)) {
      await message.delete();
      const embed = new EmbedBuilder()
        .setTitle("NSFW Filter")
        .setDescription("Message contains inappropriate content")
        .setColor(0xff0000);
      return message.channel.send({ embeds: [embed] });
    }

    // Only bot1 handles XP
    if (client.botId === "bot1") {
      await addXP(message.author.id, message);
    }

    // Forum auto-react is now handled in threadCreate event, not in messageCreate

    // Counting game logic (only bot1)
    if (client.botId === "bot1") {
      try {
        if (
          othersData?.counting_enabled &&
          message.channel.id === othersData.counting_channel
        ) {
          const content = message.content.trim();
          const isNumber = /^\d+$/.test(content);

          if (!isNumber) {
            try {
              await message.delete();
            } catch (e) {
              console.log("Failed to delete counting message:", e.message);
            }
            return;
          }

          const number = parseInt(content);
          const expectedNumber = (othersData.counting_current || 0) + 1;

          if (othersData.counting_last_user === message.author.id) {
            await Others.findOneAndUpdate(
              {},
              {
                counting_current: 0,
                counting_last_user: null,
              },
            );

            try {
              await message.react("❌");
            } catch (e) {
              console.log("Failed to react to repeat user message:", e.message);
            }

            await message.reply(
              `${message.author}, you can't count twice in a row! Counting reset to **1**.`,
            );

            try {
              const restartMessage = await message.channel.send("1");
              await restartMessage.react("✅");
              othersData.counting_current = 1;
              othersData.counting_last_user = client.user.id;
              await Others.findOneAndUpdate(
                {},
                { counting_current: 1, counting_last_user: client.user.id },
              );
            } catch (e) {
              console.log(
                "Failed to send restart counting message:",
                e.message,
              );
            }
            return;
          }

          if (number === expectedNumber) {
            othersData.counting_current = number;
            othersData.counting_last_user = message.author.id;
            await Others.findOneAndUpdate(
              {},
              {
                counting_current: number,
                counting_last_user: message.author.id,
              },
            );

            try {
              await message.react("✅");
            } catch (e) {
              console.log("Failed to react to counting message:", e.message);
            }
            return;
          } else {
            othersData.counting_current = 0;
            othersData.counting_last_user = null;
            await Others.findOneAndUpdate(
              {},
              { counting_current: 1, counting_last_user: client.user.id },
            );

            try {
              await message.react("❌");
            } catch (e) {
              console.log(
                "Failed to react to wrong counting message:",
                e.message,
              );
            }

            await message.reply(
              `Wrong number! Expected **${expectedNumber}** but got **${number}**. Counting reset to **1**.`,
            );

            try {
              const restartMessage = await message.channel.send("1");
              await restartMessage.react("✅");
              othersData.counting_current = 1;
              othersData.counting_last_user = client.user.id;
              await Others.findOneAndUpdate(
                {},
                { counting_current: 1, counting_last_user: client.user.id },
              );
            } catch (e) {
              console.log(
                "Failed to send restart counting message:",
                e.message,
              );
            }
            return;
          }
        }
      } catch (e) {
        console.error("Counting game error:", e);
      }
    }

    // AI response logic - prevent both bots from responding to same message
    const messageKey = `${message.id}-${message.channelId}`;

    // Check if any bot has already processed this message
    if (processedMessages.has(messageKey)) return;

    // Parse JSON bot configuration data
    const parseJsonField = (field, defaultValue = {}) => {
      try {
        return typeof field === "string"
          ? JSON.parse(field)
          : field || defaultValue;
      } catch (error) {
        return defaultValue;
      }
    };

    const botConfig = client.botConfig || {};

    // Check if this bot should respond in this channel
    let shouldThisBotRespond = false;

    // Don't respond in counting channel at all - counting only
    if (
      othersData?.counting_enabled &&
      othersData.counting_channel === message.channel.id
    ) {
      return;
    }

    if (message.mentions.has(client.user)) {
      // Award XP for bot mention (works for either bot, but processed by bot1)
      if (client.botId === "bot1") {
        try {
          const Experience = require("./models/postgres/Experience");
          const UserData = require("./models/postgres/UserData");
          const experienceData = await Experience.findOne();
          const mentionXp = experienceData?.mention_xp || 0;
          
          if (mentionXp > 0) {
            let userData = await UserData.findOne({ discord_id: message.author.id });
            if (!userData) {
              userData = await UserData.create({
                discord_id: message.author.id,
                username: message.author.username,
                xp: 0,
                level: 0
              });
            }
            
            const newXP = (userData.xp || 0) + mentionXp;
            const newLevel = calculateLevel(newXP);
            
            await UserData.findOneAndUpdate(
              { discord_id: message.author.id },
              { xp: newXP, level: newLevel },
              { upsert: true }
            );
          }
        } catch (error) {
          console.error("Error awarding mention XP:", error);
        }
      }

      // Direct mention - check if allowed in this channel
      const allowedChannels = botConfig?.allowed_channels || [];
      if (allowedChannels.length > 0) {
        shouldThisBotRespond = allowedChannels.includes(message.channel.id);
      } else {
        // No channel restrictions configured - respond to mentions
        shouldThisBotRespond = true;
        console.log(
          `${client.botId}: No channel restrictions, responding to mention`,
        );
      }
    } else if (message.channel.type === 1) {
      // DM - only bot1 responds
      shouldThisBotRespond = client.botId === "bot1";
    } else if (message.reference && message.reference.messageId) {
      // Reply to bot message - check if replying to this bot and if channel is allowed
      try {
        const repliedMessage = await message.channel.messages.fetch(
          message.reference.messageId,
        );
        if (repliedMessage.author.id === client.user.id) {
          const allowedChannels = botConfig?.allowed_channels || [];
          if (allowedChannels.length > 0) {
            shouldThisBotRespond = allowedChannels.includes(message.channel.id);
            console.log(
              `${client.botId} reply check: Channel ${message.channel.id}, Allowed: ${allowedChannels}, Should respond: ${shouldThisBotRespond}`,
            );
          } else {
            shouldThisBotRespond = true;
            console.log(
              `${client.botId}: No channel restrictions, responding to reply`,
            );
          }
        }
      } catch (e) {
        // Failed to fetch replied message, don't respond
        shouldThisBotRespond = false;
      }
    }

    // Only respond if this bot should respond
    if (!shouldThisBotRespond) return;

    // Extract content early for validation with optimized regex
    const content = message.content.replace(/<@!?\d+>/g, "").trim();

    // Skip very short messages unless mentioned to reduce AI load
    if (content.length < 3 && !message.mentions.has(client.user)) return;

    // Skip messages from other bots to prevent loops
    if (message.author.bot && message.author.id !== client.user.id) return;

    // Rate limiting per user - prevent spam
    const userKey = `${message.author.id}-${message.guildId}`;
    if (processedMessages.has(userKey)) {
      const lastMessage = processedMessages.get(userKey);
      if (Date.now() - lastMessage < 2000) return; // 2 second cooldown per user
    }

    // Skip responding to embeds from bot replies
    if (message.reference && message.reference.messageId) {
      try {
        const repliedMessage = await message.channel.messages.fetch(
          message.reference.messageId,
        );
        if (
          repliedMessage.author.id === client.user.id &&
          repliedMessage.embeds.length > 0
        ) {
          return;
        }
      } catch (e) {
        // Continue normally
      }
    }

    if (shouldThisBotRespond) {
      // Check blacklist from Others table
      const blacklistedUsers = JSON.parse(othersData?.blacklisted_users || '[]');
      if (blacklistedUsers.includes(message.author.id)) return;

      // Mark this specific message as processed by this bot
      processedMessages.set(messageKey, Date.now());

      setTimeout(() => {
        processedMessages.delete(messageKey);
      }, 300000);

      if (content.length === 0) return;

      try {
        // Show typing indicator for better user experience
        await message.channel.sendTyping();

        // Continue showing typing indicator every 8 seconds during processing
        const typingInterval = setInterval(() => {
          message.channel.sendTyping().catch(() => {});
        }, 8000);

        let conversationHistory = "";
        try {
          let userData = await UserData.findOne({
            discord_id: message.author.id,
          });
          if (!userData) {
            const username = message.author.username || "Unknown";
            userData = await UserData.create({
              discord_id: message.author.id,
              username,
            });
          }

          if (!userData.conversationHistory) {
            userData.conversationHistory = [];
          }

          // Save user message with bot identifier
          userData.conversationHistory.push({
            role: "user",
            content: content,
            timestamp: new Date(),
            botId: client.botId,
          });

          // Keep only last 30 messages per bot (check each bot separately)
          const bot1Messages = userData.conversationHistory.filter(
            (msg) => msg.botId === "bot1",
          );
          const bot2Messages = userData.conversationHistory.filter(
            (msg) => msg.botId === "bot2",
          );

          // Keep only last 30 messages per bot
          const limitedBot1Messages = bot1Messages.slice(-30);
          const limitedBot2Messages = bot2Messages.slice(-30);

          // Combine and sort by timestamp
          userData.conversationHistory = [
            ...limitedBot1Messages,
            ...limitedBot2Messages,
          ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

          // Filter conversation history to show context for this specific bot
          const botSpecificHistory = userData.conversationHistory
            .filter((msg) => msg.botId === client.botId)
            .slice(-10); // Last 10 messages for this specific bot

          conversationHistory = botSpecificHistory
            .map(
              (msg) =>
                `${msg.role === "user" ? "User" : botConfig.name || "Bot"}: ${msg.content}`,
            )
            .join("\n");

          // Direct SQL update for conversation history to avoid JSON serialization issues
          let updateResult = null;
          try {
            await UserData.findOneAndUpdate(
              { discord_id: message.author.id },
              {
                conversationHistory: JSON.stringify(
                  userData.conversationHistory,
                ),
              },
              { upsert: true },
            );
          } catch (error) {
            console.error("Conversation history update failed:", error);
          }
          // User message saved to conversation history
        } catch (e) {
          console.error("Conversation history error:", e);
        }

        // Load fresh bot configuration with personality data from database
        const { BotA, BotB } = loadDatabaseModels();
        let freshBotConfig = {};

        if (client.botId === "bot1") {
          const botData = await BotA.findOne();
          freshBotConfig = {
            name: botData?.name || "Heilos",
            description: botData?.description || "",
            personality: botData?.personality || "",
            age: botData?.age || "",
            likes: botData?.likes || "",
            dislikes: botData?.dislikes || "",
            appearance: botData?.appearance || "",
            backstory: botData?.backstory || "",
            others: botData?.others || "",
          };
        } else if (client.botId === "bot2") {
          const botData = await BotB.findOne();
          freshBotConfig = {
            name: botData?.name || "Wisteria",
            description: botData?.description || "",
            personality: botData?.personality || "",
            age: botData?.age || "",
            likes: botData?.likes || "",
            dislikes: botData?.dislikes || "",
            appearance: botData?.appearance || "",
            backstory: botData?.backstory || "",
            others: botData?.others || "",
          };
        }

        // Fresh bot config loaded silently

        // Load AI handler if not already loaded
        loadAIHandler();

        const response = await generateAIResponse(
          message,
          client,
          freshBotConfig, // Fresh personality data from database
          content,
          conversationHistory,
        );

        if (response && response.trim().length > 0) {
          // Clear typing indicator
          clearInterval(typingInterval);

          const deleteButton = new ButtonBuilder()
            .setCustomId(`delete_ai_${message.author.id}`)
            .setLabel("🗑️")
            .setStyle(ButtonStyle.Danger);

          const actionRow = new ActionRowBuilder().addComponents(deleteButton);

          // Send response - works in all channel types including forum and voice
          let sentMessage;
          try {
            sentMessage = await message.reply({
              content: response,
              components: [actionRow],
            });
          } catch (error) {
            // If reply fails (e.g., in certain forum/voice channels), send as regular message
            try {
              sentMessage = await message.channel.send({
                content: `${message.author}: ${response}`,
                components: [actionRow],
              });
            } catch (fallbackError) {
              // Last resort - send without components
              sentMessage = await message.channel.send(
                `${message.author}: ${response}`,
              );
            }
          }

          try {
            let userData = await UserData.findOne({
              discord_id: message.author.id,
            });
            if (userData) {
              // Initialize conversationHistory array if it doesn't exist
              if (!userData.conversationHistory) {
                userData.conversationHistory = [];
              }

              userData.conversationHistory.push({
                role: "assistant",
                content: response,
                timestamp: new Date(),
                botId: client.botId,
              });

              // Keep only last 30 messages per bot (check each bot separately)
              const bot1Messages = userData.conversationHistory.filter(
                (msg) => msg.botId === "bot1",
              );
              const bot2Messages = userData.conversationHistory.filter(
                (msg) => msg.botId === "bot2",
              );

              // Keep only last 30 messages per bot
              const limitedBot1Messages = bot1Messages.slice(-30);
              const limitedBot2Messages = bot2Messages.slice(-30);

              // Combine and sort by timestamp
              userData.conversationHistory = [
                ...limitedBot1Messages,
                ...limitedBot2Messages,
              ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

              // Direct SQL update for conversation history to avoid JSON serialization issues
              let updateResult2 = null;
              try {
                await UserData.findOneAndUpdate(
                  { discord_id: message.author.id },
                  {
                    conversationHistory: JSON.stringify(
                      userData.conversationHistory,
                    ),
                  },
                  { upsert: true },
                );
              } catch (error) {
                console.error("AI conversation history update failed:", error);
              }
              // AI response saved to conversation history
            }
          } catch (e) {
            console.error("Assistant conversation history error:", e);
          }
        }
      } catch (error) {
        // Clear typing indicator on error
        if (typeof typingInterval !== "undefined") {
          clearInterval(typingInterval);
        }

        console.error("AI response error:", error);

        // Send user-friendly error message for different error types
        let errorMessage =
          "Sorry, I'm having trouble responding right now. Please try again in a moment.";

        if (error.message.includes("quota")) {
          errorMessage =
            "I'm currently over my usage limit. Please try again later.";
        } else if (error.message.includes("timeout")) {
          errorMessage =
            "That took too long to process. Please try a shorter message.";
        } else if (error.message.includes("busy")) {
          errorMessage =
            "I'm handling too many requests right now. Please wait a moment and try again.";
        }

        try {
          await message.reply(errorMessage);
        } catch (e) {
          console.error("Failed to send error message:", e);
        }
      }
    }
  });

  // Handle forum thread creation for auto-react and XP rewards
  client.on("threadCreate", async (thread) => {
    try {
      // Only handle forum threads
      if (thread.parent?.type !== ChannelType.GuildForum) return;

      // Get Others data for forum auto-react settings
      const Others = require("./models/postgres/Others");
      const othersData = await Others.findOne();

      // Award XP for creating a forum thread (only bot1 handles XP)
      if (client.botId === "bot1" && thread.ownerId) {
        try {
          const UserData = require("./models/postgres/UserData");
          const Experience = require("./models/postgres/Experience");
          // Get current user data, or create if it doesn't exist
          let userData = await UserData.findOne({ discord_id: thread.ownerId });
          if (!userData) {
            const member = thread.guild.members.cache.get(thread.ownerId) || await thread.guild.members.fetch(thread.ownerId).catch(() => null);
            userData = await UserData.create({
              discord_id: thread.ownerId,
              username: member?.user?.username || `User_${thread.ownerId.slice(-4)}`,
              xp: 0,
              level: 0,
            });
          }
          // If user data is still not available, log error and exit
          if (!userData) {
            console.error(`Could not find or create user ${thread.ownerId} for thread XP award.`);
            return;
          }
          // Use Experience model for thread XP config
          const experienceData = await Experience.findOne();
          const threadXP = experienceData?.thread_xp || 20;
          const newXP = (userData.xp || 0) + threadXP;
          const newLevel = calculateLevel(newXP);
          // Single, atomic update for XP and level
          await UserData.findOneAndUpdate(
            { discord_id: thread.ownerId },
            {
              xp: newXP,
              level: newLevel,
            },
            { upsert: true },
          );
          // No level-up announcements for forum threads
        } catch (error) {
          console.error("Error awarding XP for thread creation:", error);
        }
      }

      if (!othersData?.forum_auto_react_enabled) return;

      // Parse forum channels settings
      let forumChannels = {};
      try {
        forumChannels = othersData.forum_channels
          ? JSON.parse(othersData.forum_channels)
          : {};
      } catch (e) {
        console.log("Error parsing forum_channels JSON:", e.message);
        return;
      }

      // Get configured emojis for this bot
      let emojiList = [];
      if (client.botId === "bot1" && forumChannels.bot1EmojiList) {
        emojiList = forumChannels.bot1EmojiList
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e);
      } else if (client.botId === "bot2" && forumChannels.bot2EmojiList) {
        emojiList = forumChannels.bot2EmojiList
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e);
      }

      if (emojiList.length === 0) return;

      // Wait a moment for the thread to be fully created, then fetch the starter message
      setTimeout(async () => {
        try {
          const starterMessage = await thread.fetchStarterMessage();
          if (starterMessage) {
            // React to the starter message
            for (const emoji of emojiList) {
              try {
                await starterMessage.react(emoji);
                console.log(
                  `${client.botId} reacted with ${emoji} to new forum thread: ${thread.name}`,
                );
                await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay between reactions
              } catch (error) {
                console.log(`Failed to react with ${emoji}:`, error.message);
              }
            }
          }
        } catch (error) {
          console.log(
            "Error reacting to forum thread starter message:",
            error.message,
          );
        }
      }, 1000); // 1 second delay to ensure thread is fully created
    } catch (error) {
      console.log("Error in threadCreate handler:", error.message);
    }
  });

  // Advanced Reaction Roles Event Handlers with Auto-Initialization
  client.on("messageReactionAdd", async (reaction, user) => {
    try {
      // Ignore bot reactions
      if (user.bot) return;

      // Handle partial reactions
      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          console.error("Error fetching reaction:", error);
          return;
        }
      }

      const messageId = reaction.message.id;
      // Handle both unicode emojis and custom Discord emojis
      const emoji = reaction.emoji.id
        ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
        : reaction.emoji.name;
      const userId = user.id;
      const guildId = reaction.message.guildId;

      // Reaction logging removed per user request

      // Find matching reaction role using lazy loaded models
      const { ReactionRole } = loadDatabaseModels();

      // Try to find the reaction role - check multiple formats for emoji
      let reactionRole = await ReactionRole.findOne({
        message_id: messageId,
        emoji_id: emoji,
      });

      // If not found with current format, try alternative formats
      if (!reactionRole && reaction.emoji.id) {
        // Try without angle brackets for custom emojis
        const altEmoji = `${reaction.emoji.name}:${reaction.emoji.id}`;
        reactionRole = await ReactionRole.findOne({
          message_id: messageId,
          emoji_id: altEmoji,
        });
      }

      if (!reactionRole) {
        // No reaction role found - silently return without logging
        return;
      }

      // Get guild member
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return;

      const member = await guild.members.fetch(userId);
      if (!member) return;

      // Check if this is a single selection set
      if (reactionRole.set_mode === "single") {
        // Remove all other reactions from this user in the same set
        const setReactions = await ReactionRole.find({
          set_id: reactionRole.set_id,
        });

        for (const setReaction of setReactions) {
          if (setReaction.emoji_id !== emoji) {
            try {
              // Find the emoji on the message and remove user's reaction
              const message = reaction.message;
              const existingReaction = message.reactions.cache.find((r) => {
                const reactionEmoji = r.emoji.id
                  ? `<:${r.emoji.name}:${r.emoji.id}>`
                  : r.emoji.name;
                return reactionEmoji === setReaction.emoji_id;
              });

              if (
                existingReaction &&
                existingReaction.users.cache.has(userId)
              ) {
                await existingReaction.users.remove(userId);
              }

              // Remove the role if user has it
              const role = guild.roles.cache.get(setReaction.role_id);
              if (role && member.roles.cache.has(role.id)) {
                const botMember = guild.members.me;
                if (botMember.roles.highest.position > role.position) {
                  await member.roles.remove(role);
                  console.log(
                    `Removed role ${role.name} from ${user.username} (single selection mode)`,
                  );
                } else {
                  console.error(
                    `Cannot remove role ${role.name}: Bot's role not high enough in hierarchy`,
                  );
                }
              }
            } catch (error) {
              console.error(
                `Error removing reaction/role in single mode:`,
                error,
              );
            }
          }
        }
      }

      // Get the target role
      const role = guild.roles.cache.get(reactionRole.role_id);
      if (!role) {
        console.error(`Role ${reactionRole.role_id} not found in guild`);
        return;
      }

      // Check if user already has this role - send hidden embed message
      if (member.roles.cache.has(role.id)) {
        try {
          const { EmbedBuilder } = require("discord.js");
          const alreadyHasRoleEmbed = new EmbedBuilder()
            .setTitle("⚠️ Role Already Assigned")
            .setDescription(`You already have the **${role.name}** role!`)
            .setColor("#FF6B6B")
            .setTimestamp();

          // Send hidden message to user only
          await user.send({ embeds: [alreadyHasRoleEmbed] }).catch((error) => {
            console.log(`Could not DM user ${user.username}:`, error.message);
          });

          console.log(
            `User ${user.username} already has role ${role.name}, sent notification`,
          );
        } catch (error) {
          console.error("Error sending already-has-role message:", error);
        }
        return;
      }

      // Check if user already has the same role (send hidden notification)
      const userRoles = member.roles.cache;
      if (userRoles.has(reactionRole.role_id)) {
        // User already has this role, send hidden embed notification
        const embed = new EmbedBuilder()
          .setColor("#ffcc00")
          .setTitle("Already Have Role")
          .setDescription(`You already have the **${targetRole.name}** role!`)
          .setTimestamp();

        try {
          await user.send({ embeds: [embed] });
          console.log(
            `User ${user.username} already has role ${targetRole.name}, sent notification`,
          );
        } catch (error) {
          console.log(`Could not DM user ${user.username}: ${error.message}`);
        }
        return;
      }

      // Remove other roles from the SAME set only (single selection per set)
      try {
        const currentSetRoles = await ReactionRole.find({
          set_id: reactionRole.set_id,
        });

        const conflictingUserRoles = currentSetRoles.filter(
          (setRole) =>
            setRole.role_id !== reactionRole.role_id &&
            userRoles.has(setRole.role_id),
        );

        for (const conflictingRole of conflictingUserRoles) {
          const roleToRemove = guild.roles.cache.get(conflictingRole.role_id);
          if (
            roleToRemove &&
            guild.members.me.roles.highest.position > roleToRemove.position
          ) {
            await member.roles.remove(roleToRemove);
            console.log(
              `Removed conflicting role ${roleToRemove.name} from ${user.username} (one role per set: ${reactionRole.set_name})`,
            );
          }
        }
      } catch (error) {
        console.error("Error managing set role conflicts:", error);
      }

      // Add the selected role with hierarchy checking
      try {
        // Check if bot can manage this role (role hierarchy)
        const botMember = guild.members.me;
        if (botMember.roles.highest.position <= role.position) {
          console.error(
            `Cannot assign role ${role.name}: Bot's highest role (${botMember.roles.highest.name}) is not above target role`,
          );

          // Try to notify the user about the role hierarchy issue
          try {
            const channel = reaction.message.channel;
            if (channel && channel.isTextBased()) {
              await channel.send({
                content: `<@${user.id}> I cannot assign the **${role.name}** role because it's positioned above my highest role in the server hierarchy. Please contact an administrator to move my role above **${role.name}**.`,
                allowedMentions: { users: [user.id] },
              });
            }
          } catch (notifyError) {
            console.error(
              "Failed to notify user about role hierarchy:",
              notifyError,
            );
          }
          return;
        }

        await member.roles.add(role);
        console.log(
          `Added role ${role.name} to ${user.username} via reaction ${emoji}`,
        );
      } catch (error) {
        console.error(`Error adding role ${role.name}:`, error);

        // Provide more specific error information
        if (error.code === 50013) {
          console.error(
            `Missing permissions to assign role ${role.name}. Check bot permissions and role hierarchy.`,
          );
        }
      }
    } catch (error) {
      console.error("Error in messageReactionAdd handler:", error);
    }
  });

  client.on("messageReactionRemove", async (reaction, user) => {
    try {
      // Ignore bot reactions
      if (user.bot) return;

      // Handle partial reactions
      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          console.error("Error fetching reaction:", error);
          return;
        }
      }

      const messageId = reaction.message.id;
      // Handle both unicode emojis and custom Discord emojis
      const emoji = reaction.emoji.id
        ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
        : reaction.emoji.name;
      const userId = user.id;
      const guildId = reaction.message.guildId;

      // Find matching reaction role using lazy loaded models
      const { ReactionRole } = loadDatabaseModels();
      const reactionRole = await ReactionRole.findOne({
        message_id: messageId,
        emoji_id: emoji,
      });

      if (!reactionRole) return;

      // Get guild member
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return;

      const member = await guild.members.fetch(userId);
      if (!member) return;

      // Remove the role with hierarchy checking
      const role = guild.roles.cache.get(reactionRole.role_id);
      if (role && member.roles.cache.has(role.id)) {
        try {
          // Check if bot can manage this role (role hierarchy)
          const botMember = guild.members.me;
          if (botMember.roles.highest.position <= role.position) {
            console.error(
              `Cannot remove role ${role.name}: Bot's highest role (${botMember.roles.highest.name}) is not above target role`,
            );
            return;
          }

          await member.roles.remove(role);
          console.log(
            `Removed role ${role.name} from ${user.username} via reaction removal ${emoji}`,
          );
        } catch (error) {
          console.error(`Error removing role ${role.name}:`, error);

          if (error.code === 50013) {
            console.error(
              `Missing permissions to remove role ${role.name}. Check bot permissions and role hierarchy.`,
            );
          }
        }
      }
    } catch (error) {
      console.error("Error in messageReactionRemove handler:", error);
    }
  });

  // Listen for reaction role set creation event to reinitialize
  client.on("reactionRoleSetCreated", async (data) => {
    try {
      console.log(
        `Reinitializing reaction roles after new set creation: ${data.setId}`,
      );
      // Wait a moment for database to update, then reinitialize
      setTimeout(() => {
        initializeReactionRoles();
      }, 2000);
    } catch (error) {
      console.error("Error in reactionRoleSetCreated handler:", error);
    }
  });

  // Discord reconnection handling
  client.on("disconnect", (event) => {
    console.warn(`${botName} disconnected from Discord:`, event);
  });

  client.on("error", (error) => {
    console.error(`${botName} Discord client error:`, error);

    // Don't crash on common recoverable errors
    if (
      error.code === "ECONNRESET" ||
      error.code === "ENOTFOUND" ||
      error.message.includes("Connection reset")
    ) {
      console.log(`${botName} will attempt to reconnect automatically`);
      return;
    }

    // Log critical errors but don't crash
    console.error(`${botName} critical error - monitoring for reconnection`);
  });

  client.on("warn", (warning) => {
    console.warn(`${botName} warning:`, warning);
  });

  client.on("shardDisconnect", (event, shardId) => {
    console.warn(`${botName} shard ${shardId} disconnected:`, event);
  });

  client.on("shardReconnecting", (shardId) => {
    console.log(`${botName} shard ${shardId} attempting to reconnect...`);
  });

  client.on("shardReady", (shardId) => {
    console.log(`${botName} shard ${shardId} ready and connected`);
  });

  client.on("shardResume", (shardId, replayedEvents) => {
    console.log(
      `${botName} shard ${shardId} resumed (${replayedEvents} events replayed)`,
    );
  });

  // Login with retry logic
  const loginWithRetry = async (retries = 3, delay = 5000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`${botName} login attempt ${attempt}/${retries}`);
        client.once('ready', async () => {
            console.log('Bot is ready! Updating member roles...');
            for (const guild of client.guilds.cache.values()) {
                try {
                    await global.updateAllMemberRoles(guild);
                    console.log(`Updated roles for guild: ${guild.name}`);
                } catch (error) {
                    console.error(`Failed to update roles for guild ${guild.name}:`, error);
                }
            }
            console.log('Member roles update complete!');
        });

        await client.login(botToken);
        console.log(`${botName} successfully logged in`);
        return;
      } catch (error) {
        console.error(
          `${botName} login attempt ${attempt} failed:`,
          error.message,
        );

        if (attempt === retries) {
          throw new Error(
            `${botName} failed to login after ${retries} attempts: ${error.message}`,
          );
        }

        console.log(`${botName} retrying login in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      }
    }
  };

  await loginWithRetry();

  // Set global variables for the web dashboard
  if (botName === "Bot1") {
    global.discordClient1 = client;
    global.discordClient = client; // For backward compatibility
  } else if (botName === "Bot2") {
    global.discordClient2 = client;
  }
};

// Memory optimization - cleanup processed messages periodically
const cleanupProcessedMessages = () => {
  const now = Date.now();
  const HOUR_MS = 60 * 60 * 1000;

  for (const [messageId, timestamp] of processedMessages.entries()) {
    if (now - timestamp > HOUR_MS) {
      processedMessages.delete(messageId);
    }
  }
};

// Performance monitoring
const logMemoryUsage = () => {
  const used = process.memoryUsage();
  const mb = (bytes) => Math.round((bytes / 1024 / 1024) * 100) / 100;

  // Memory usage logging removed per user request
};

// Start both bots with optimization
(async () => {
  try {
    console.log("Starting optimized Discord bot system...");

    // Performance monitoring - cleanup processed messages every 10 minutes
    setInterval(
      () => {
        const now = Date.now();
        const CLEANUP_THRESHOLD = 10 * 60 * 1000; // 10 minutes

        for (const [key, timestamp] of processedMessages.entries()) {
          if (now - timestamp > CLEANUP_THRESHOLD) {
            processedMessages.delete(key);
          }
        }
      },
      10 * 60 * 1000,
    );

    // Start bots in parallel for faster startup
    const [bot1Result, bot2Result] = await Promise.allSettled([
      setupBot(client1, process.env.DISCORD_TOKEN, "Bot1"),
      setupBot(client2, process.env.DISCORD_TOKEN_2, "Bot2"),
    ]);

    if (bot1Result.status === "rejected")
      console.error("Bot1 failed:", bot1Result.reason);
    if (bot2Result.status === "rejected")
      console.error("Bot2 failed:", bot2Result.reason);

    // Initialize reaction roles after both bots are ready and guild data is loaded
    setTimeout(async () => {
      try {
        console.log("Initializing reaction roles system...");
        await initializeReactionRoles();
        console.log("Reaction roles initialization completed");
      } catch (error) {
        console.error("Failed to initialize reaction roles:", error);
      }
    }, 3000); // Wait 3 seconds for guild cache to populate

    // Set up optimized cleanup intervals
    const cleanupInterval = setInterval(
      () => {
        const { cleanupCache } = loadAIHandler();
        cleanupCache();
        cleanupProcessedMessages();

        // Run garbage collection if available
        if (global.gc) {
          global.gc();
        }

        // System cleanup completed silently
      },
      5 * 60 * 1000,
    ); // Every 5 minutes

    // Memory monitoring every 10 minutes
    const memoryInterval = setInterval(logMemoryUsage, 10 * 60 * 1000);

    // Store intervals for cleanup
    process.cleanupIntervals = [cleanupInterval, memoryInterval];

    console.log("Bot system startup completed with optimizations");
  } catch (error) {
    console.error("Failed to start bots:", error);
    process.exit(1);
  }
})();

// Keep-alive mechanism for Render.com using native Node.js modules
const keepAlive = () => {
  // Self-ping every 14 minutes to prevent sleeping on free tier
  setInterval(
    () => {
      try {
        // Use Render.com external URL or fallback to localhost
        const baseUrl =
          process.env.RENDER_EXTERNAL_URL ||
          (process.env.RENDER_SERVICE_NAME
            ? `https://${process.env.RENDER_SERVICE_NAME}.onrender.com`
            : "http://localhost:5000");
        const healthUrl = `${baseUrl}/health`;

        console.log(`Sending keep-alive ping to: ${healthUrl}`);

        // Use https module for HTTPS URLs, http for HTTP URLs
        const isHttps = healthUrl.startsWith("https://");
        const httpModule = isHttps ? require("https") : require("http");

        const req = httpModule.get(healthUrl, (res) => {
          if (res.statusCode === 200) {
            console.log("Keep-alive ping successful");
          } else {
            console.log(`Keep-alive ping returned status: ${res.statusCode}`);
          }
        });

        req.on("error", (error) => {
          console.log("Keep-alive ping failed:", error.message);
        });

        req.setTimeout(10000, () => {
          req.destroy();
          console.log("Keep-alive ping timeout after 10 seconds");
        });
      } catch (error) {
        console.log("Keep-alive setup error:", error.message);
      }
    },
    14 * 60 * 1000,
  ); // Every 14 minutes
};

// Start keep-alive for Render.com
if (
  process.env.RENDER ||
  process.env.RENDER_SERVICE_NAME ||
  process.env.NODE_ENV === "production"
) {
  console.log("Starting keep-alive mechanism for Render.com...");
  keepAlive();
}

// Enhanced graceful shutdown with reconnection logic
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}, attempting graceful handling...`);

  // For SIGTERM on Render or production, try to reconnect instead of shutting down
  if (
    signal === "SIGTERM" &&
    (process.env.RENDER ||
      process.env.RENDER_SERVICE_NAME ||
      process.env.NODE_ENV === "production" ||
      process.env.RAILWAY_STATIC_URL ||
      process.env.VERCEL)
  ) {
    console.log(
      "SIGTERM received on Render - attempting to maintain connection...",
    );

    // Try to reconnect Discord clients instead of shutting down
    setTimeout(async () => {
      try {
        console.log("Attempting Discord client reconnection...");

        // Check if clients are still connected
        if (client1.isReady()) {
          console.log("Bot1 still connected");
        } else {
          console.log("Bot1 reconnecting...");
          await client1.login(process.env.DISCORD_TOKEN);
        }

        if (client2.isReady()) {
          console.log("Bot2 still connected");
        } else {
          console.log("Bot2 reconnecting...");
          await client2.login(process.env.DISCORD_TOKEN_2);
        }

        console.log("Reconnection attempt completed");
        return; // Don't shutdown, keep running
      } catch (error) {
        console.error("Reconnection failed:", error);
        // Fall through to normal shutdown
      }
    }, 1000);

    // Don't proceed with shutdown immediately
    return;
  }

  // Normal shutdown for other signals
  console.log(`Proceeding with shutdown for ${signal}...`);

  // Clear intervals
  if (process.cleanupIntervals) {
    process.cleanupIntervals.forEach(clearInterval);
  }

  // Cleanup AI cache
  try {
    const { cleanupCache } = loadAIHandler();
    cleanupCache();
  } catch (error) {
    console.error("Error cleaning up AI cache:", error);
  }

  // Destroy Discord clients
  Promise.allSettled([client1?.destroy(), client2?.destroy()])
    .then(() => {
      console.log("Bot system shutdown complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error during shutdown:", error);
      process.exit(1);
    });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.log("Force exit after timeout");
    process.exit(1);
  }, 10000);
};

// Handle multiple shutdown signals
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

// --- Top 5 XP Role Assignment ---
async function updateTop5Roles(guildId) {
  try {
    const TopRoles = require('./models/postgres/TopRoles');
    const UserData = require('./models/postgres/UserData');
    
    const topRolesData = await TopRoles.findOne({});
    if (!topRolesData) return;
    const topRoles = [
      topRolesData.top1_role || '',
      topRolesData.top2_role || '',
      topRolesData.top3_role || '',
      topRolesData.top4_role || '',
      topRolesData.top5_role || '',
    ];
    const guild = client1.guilds.cache.get(guildId);
    if (!guild) return;
    await guild.members.fetch();
    const topUsers = (await UserData.find({})).sort((a, b) => b.xp - a.xp).slice(0, 5);
    const topUserIds = topUsers.map(u => u.discord_id);
    for (let i = 0; i < 5; i++) {
      const userId = topUserIds[i];
      const roleId = topRoles[i];
      if (!userId || !roleId) continue;
      try {
        const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
        const role = guild.roles.cache.get(roleId);

        if (member && role) {
          // Remove any other top roles the user might have before adding the new one
          for (const otherRoleId of topRoles) {
            if (otherRoleId && otherRoleId !== roleId) {
              const otherRole = guild.roles.cache.get(otherRoleId);
              if (otherRole && member.roles.cache.has(otherRole.id)) {
                await member.roles.remove(otherRole);
              }
            }
          }
          // Add the new top role if the user doesn't have it
          if (!member.roles.cache.has(role.id)) {
            await member.roles.add(role);
          }
        }
      } catch (err) {
        console.log(`[Top5Roles] Error assigning Top ${i+1} role:`, err.message);
      }
    }
    for (let i = 0; i < 5; i++) {
      const roleId = topRoles[i];
      if (!roleId) continue;
      const role = guild.roles.cache.get(roleId);
      if (!role) continue;
      for (const member of role.members.values()) {
        if (!topUserIds.includes(member.id)) {
          try {
            await member.roles.remove(role);
          } catch (err) {
            console.log(`[Top5Roles] Error removing Top role:`, err.message);
          }
        }
      }
    }
  } catch (err) {
    console.log('[Top5Roles] Error in updateTop5Roles:', err.message);
  }
}

// --- Streaming XP Reward ---
let streamingInterval;

async function updateStreamingXPInterval() {
  try {
    const Experience = require('./models/postgres/Experience');
    const experienceData = await Experience.findOne({});
    const streamerXp = experienceData?.streamer_xp || 3; // Default 3 XP
    const minuteCheck = experienceData?.minute_check || 15; // Default 15 minutes

    // Clear existing interval if it exists
    if (streamingInterval) {
      clearInterval(streamingInterval);
    }

    // Set new interval with values from database
    streamingInterval = setInterval(async () => {
      try {
        if (!client1 || !client1.readyAt) return;
        for (const guild of client1.guilds.cache.values()) {
          await guild.members.fetch(); // Ensure member cache is populated
          for (const channel of guild.channels.cache.values()) {
            if (channel.type !== 2) continue; // Only voice channels
            for (const member of channel.members.values()) {
              if (member.user.bot) continue;
              if (member.voice && member.voice.streaming) {
                try {
                  await addXP(member.id, null, streamerXp, 'streaming');
                } catch (err) {
                  console.log(`[StreamingXP] Error giving XP to ${member.user.username}:`, err.message);
                }
              }
            }
          }
        }
      } catch (err) {
        console.log('[StreamingXP] Error in streaming XP interval:', err.message);
      }
    }, minuteCheck * 60 * 1000); // Convert minutes to milliseconds
  } catch (err) {
    console.error('[StreamingXP] Error updating interval:', err.message);
  }
}

// Initialize streaming XP interval
updateStreamingXPInterval();

// Update interval when database values change
global.updateStreamingXPInterval = updateStreamingXPInterval;

module.exports = { client1, client2, getRandomPastelColor };
