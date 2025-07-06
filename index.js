// Core modules - loaded once and cached
const fs = require("fs");
const fsPromises = require("fs").promises; // Use promises for better async performance
const path = require("path");

// Discord.js imports - optimized for performance
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
} = require("discord.js");

// Database models - lazy loaded to improve startup time
let BotA, BotB, Others, UserData, LevelRoles, Birthday, ReactionRole;
const loadDatabaseModels = () => {
  if (!BotA) {
    BotA = require("./models/postgres/BotA");
    BotB = require("./models/postgres/BotB");
    Others = require("./models/postgres/Others");
    UserData = require("./models/postgres/UserData");
    LevelRoles = require("./models/postgres/LevelRoles");
    Birthday = require("./models/postgres/Birthday");
    ReactionRole = require("./models/postgres/ReactionRole");
  }
  return {
    BotA,
    BotB,
    Others,
    UserData,
    LevelRoles,
    Birthday,
    ReactionRole,
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
  "#FFB3BA",
  "#FFDFBA",
  "#FFFFBA",
  "#BAFFC9",
  "#BAE1FF",
  "#E1BAFF",
  "#FFB3E6",
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

// Use Map for better performance with large datasets
const processedMessages = new Map(); // Store with timestamp for cleanup

// XP tracking optimization - use Set for faster lookups
const recentXPUsers = new Set(); // Track users who recently gained XP

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
  },
  sweepers: {
    messages: {
      interval: 300000, // Clean up messages every 5 minutes
      lifetime: 1800000, // Keep messages for 30 minutes
    },
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
                  console.log(
                    `Added missing reaction ${emoji} to message ${messageId}`,
                  );
                } catch (error) {
                  console.error(
                    `Failed to add reaction ${emoji} to message ${messageId}:`,
                    error,
                  );
                }
              }
            }
          } else {
            // Message not found - delete all reaction role sets for this message
            console.log(`Message ${messageId} not found, deleting associated reaction role sets...`);
            
            try {
              // Get unique set IDs for this message
              const setIds = [...new Set(roles.map(role => role.set_id))];
              
              for (const setId of setIds) {
                const deletedCount = await ReactionRole.deleteBySetId(setId);
                console.log(`Deleted reaction role set ${setId} (${deletedCount} entries) - orphaned from message ${messageId}`);
              }
            } catch (deleteError) {
              console.error(`Failed to delete orphaned reaction role sets for message ${messageId}:`, deleteError);
            }
          }
        } catch (error) {
          console.error(
            `Error processing reaction roles for message ${messageId}:`,
            error,
          );
        }
      }

      console.log("Reaction roles initialization completed");
    } else {
      console.log("No reaction roles found to initialize");
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

    // Sync dashboard data on startup
    global.dashboardData = {
      bot1Config: BotA || {},
      bot2Config: BotB || {},
      xpSettings: othersData || {},
      forumAutoReact: { enabled: false },
      counting: { enabled: false },
      stats: { interactions: 0, commands: 0 },
    };

    console.log("Dashboard data synchronized with database");

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

    // Update Others data
    if (updatedData.xpSettings) {
      await Others.findOneAndUpdate({}, updatedData.xpSettings, {
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
  if (xp === 0) return 1;
  
  let currentXP = 0;
  let level = 1;
  
  while (true) {
    const tierMultiplier = 1 + Math.floor((level - 1) / 5) * 0.15;
    let xpNeeded;
    
    if (level === 1) {
      xpNeeded = 100; // Level 2 requires 100 XP
    } else {
      xpNeeded = Math.pow(level - 1, 2) * 100 * tierMultiplier;
    }
    
    if (currentXP + xpNeeded > xp) break;
    currentXP += xpNeeded;
    level++;
  }
  
  return level;
};

const xpForLevel = (level) => {
  if (level <= 1) return 0;
  
  let totalXP = 0;
  
  for (let i = 1; i < level; i++) {
    const tierMultiplier = 1 + Math.floor((i - 1) / 5) * 0.15;
    
    if (i === 1) {
      totalXP += 100; // Level 2 requires 100 XP
    } else {
      totalXP += Math.pow(i - 1, 2) * 100 * tierMultiplier;
    }
  }
  
  return Math.floor(totalXP);
};

// XP is only handled by Bot 1
const addXP = async (userId, guildId) => {
  try {
    const othersData = await Others.findOne();
    if (!othersData) return;

    let user = await UserData.findOne({ userId });
    if (!user) {
      const guild = client1.guilds.cache.get(guildId);
      const member = guild?.members.cache.get(userId);
      const username = member?.user?.username || "Unknown";
      user = await UserData.create({ userId, username });
    }

    if (
      Date.now() - new Date(user.last_xp_gain) <
      (othersData.xp_cooldown || 70000)
    )
      return;

    const oldLevel = user.level;
    const minXp = othersData.min_xp || 1;
    const maxXp = othersData.max_xp || 15;
    const randomXp = Math.floor(Math.random() * (maxXp - minXp + 1)) + minXp;
    const newXp = user.xp + randomXp;
    const newLevel = calculateLevel(newXp);

    user = await UserData.findOneAndUpdate(
      { userId },
      {
        xp: newXp,
        level: newLevel,
        lastXpGain: new Date(),
      },
      { upsert: true },
    );

    // Announce when user reaches level 1 from level 0, or when they level up normally
    if (
      (newLevel >= 1 && oldLevel === 0 && othersData?.level_up_announcement) ||
      (newLevel > oldLevel && oldLevel > 0 && othersData?.level_up_announcement)
    ) {
      const guild = client1.guilds.cache.get(guildId);
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

              const prompt = `Generate a short celebratory congratulation message for someone leveling up in a Discord server. Keep it under 40 characters, make it fun and encouraging. Just return the message, nothing else.Emojis not allowed`;

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
            const isWelcomeMessage = oldLevel === 0 && user.level === 1;
            const embedTitle = isWelcomeMessage
              ? "<:_celebrate:1206495792777531442> Level Up!"
              : "<:_celebrate:1206495792777531442> Level Up!";
            const embedDescription = isWelcomeMessage
              ? `${member} just started chatting and reached **Level 1**!\n\n*${congratulationMessage}*\n\n\n`
              : `${member} has reached **Level ${user.level}**!\n\n*${congratulationMessage}*\n\n\n`;

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
                console.log(
                  "Bot 1 failed to send level up message, trying Bot 2",
                );
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
                console.log(
                  "Bot 2 failed to send level up message, using fallback",
                );
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
  } catch (e) {
    console.error("XP error:", e);
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
          console.log(
            `${botName} has Administrator permission in ${guild.name}`,
          );
        } else if (missingPerms.length > 0) {
          console.warn(
            `${botName} missing permissions in ${guild.name}:`,
            missingPerms.join(", "),
          );
        } else {
          console.log(`${botName} has sufficient permissions in ${guild.name}`);
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

      // Welcome Message
      if (othersData.welcomer_enabled && othersData.welcomer_channel) {
        const welcomeChannel = member.guild.channels.cache.get(
          othersData.welcomer_channel,
        );
        if (welcomeChannel && welcomeChannel.isTextBased()) {
          const userMention = `<@${member.user.id}>`;

          if (othersData.welcomer_embed_enabled) {
            // Send rich embed welcome message
            const embed = new EmbedBuilder()
              .setTitle(othersData.welcomer_embed_title || "Welcome!")
              .setDescription(
                (
                  othersData.welcomer_embed_description ||
                  "Welcome to our server, {user}! We're glad you're here."
                ).replace("{user}", userMention),
              )
              .setColor(othersData.welcomer_embed_color || "#7c3aed")
              .setFooter({
                text: othersData.welcomer_embed_footer || "Have a great time!",
              })
              .setTimestamp();

            if (othersData.welcomer_embed_thumbnail) {
              embed.setThumbnail(
                member.user.displayAvatarURL({ dynamic: true }),
              );
            }

            await welcomeChannel.send({ embeds: [embed] });
          } else {
            // Send plain text welcome message
            const welcomeMessage = (
              othersData.welcomer_message || "Welcome to the server, {user}!"
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
          await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
          const embed = new EmbedBuilder()
            .setTitle("❌ Access Denied")
            .setDescription("Only the original user can delete this message")
            .setColor(0xff0000);
          await interaction.reply({ embeds: [embed], ephemeral: true });
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
          .setTitle("❌ Counting Channel")
          .setDescription(
            `No commands are allowed in the counting channel. This channel is for counting only.`,
          )
          .setColor(0xff0000);

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Commands that work in all channels (no restrictions)
      const globalCommands = ["purge"];

      // VC commands require both voice channel AND allowed channel restrictions
      const vcCommands = ["vc-join", "vc-play", "vc-add", "vc-disconnect"];

      if (vcCommands.includes(interaction.commandName)) {
        // Check if user is in voice channel
        if (!interaction.member?.voice?.channel) {
          const embed = new EmbedBuilder()
            .setTitle("❌ Voice Channel Required")
            .setDescription(
              `You must be in a voice channel to use this command.`,
            )
            .setColor(0xff0000);

          return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Also check if VC command is allowed in this channel
        const allowedChannels = botConfig?.allowed_channels || [];
        if (allowedChannels.length > 0) {
          if (!allowedChannels.includes(interaction.channelId)) {
            const embed = new EmbedBuilder()
              .setTitle("❌ Channel Restricted")
              .setDescription(
                `Voice commands can only be used in allowed channels. Contact an administrator to configure channel permissions.`,
              )
              .setColor(0xff0000);

            return await interaction.reply({
              embeds: [embed],
              ephemeral: true,
            });
          }
        }
      } else if (!globalCommands.includes(interaction.commandName)) {
        // All other commands check allowed channels
        const allowedChannels = botConfig?.allowed_channels || [];
        if (allowedChannels.length > 0) {
          if (!allowedChannels.includes(interaction.channelId)) {
            const embed = new EmbedBuilder()
              .setTitle("❌ Channel Restricted")
              .setDescription(
                `This command can only be used in allowed channels. Contact an administrator to configure channel permissions.`,
              )
              .setColor(0xff0000);

            return await interaction.reply({
              embeds: [embed],
              ephemeral: true,
            });
          }
        }
      }
    } catch (error) {
      console.error("Channel restriction check error:", error);
    }

    try {
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

      if (!interaction.replied && !interaction.deferred) {
        const embed = new EmbedBuilder()
          .setTitle(errorTitle)
          .setDescription(errorMessage)
          .setColor(0xff0000)
          .setFooter({
            text: "Contact an administrator if this issue persists",
          });

        try {
          await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (e) {
          console.log("Failed to send error reply:", e.message);
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
      await addXP(message.author.id, message.guildId);
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
          const expectedNumber = (othersData.current_count || 0) + 1;

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
              `❌ Wrong number! Expected **${expectedNumber}** but got **${number}**. Counting reset to **1**.`,
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
      // Direct mention - check if allowed in this channel
      const allowedChannels = botConfig?.allowed_channels || [];
      if (allowedChannels.length > 0) {
        shouldThisBotRespond = allowedChannels.includes(message.channel.id);
        console.log(
          `${client.botId} mention check: Channel ${message.channel.id}, Allowed: ${allowedChannels}, Should respond: ${shouldThisBotRespond}`,
        );
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

    // Extract content early for validation
    const content = message.content.replace(/<@!?\d+>/g, "").trim();

    // Skip very short messages unless mentioned to reduce AI load
    if (content.length < 3 && !message.mentions.has(client.user)) return;

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
      if (
        botConfig?.blacklistedUsers &&
        botConfig.blacklistedUsers.includes(message.author.id)
      )
        return;

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
          let userData = await UserData.findOne({ userId: message.author.id });
          if (!userData) {
            const username = message.author.username || "Unknown";
            userData = await UserData.create({
              userId: message.author.id,
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
          const bot1Messages = userData.conversationHistory.filter(msg => msg.botId === 'bot1');
          const bot2Messages = userData.conversationHistory.filter(msg => msg.botId === 'bot2');
          
          // Keep only last 30 messages per bot
          const limitedBot1Messages = bot1Messages.slice(-30);
          const limitedBot2Messages = bot2Messages.slice(-30);
          
          // Combine and sort by timestamp
          userData.conversationHistory = [...limitedBot1Messages, ...limitedBot2Messages]
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

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
              { userId: message.author.id },
              { 
                conversationHistory: JSON.stringify(userData.conversationHistory)
              },
              { upsert: true }
            );
          } catch (error) {
            console.error('Conversation history update failed:', error);
          }
          console.log(
            `Saved user message to conversation history for ${message.author.id}. Total messages: ${userData.conversationHistory.length}`,
          );

        } catch (e) {
          console.error("Conversation history error:", e);
        }

        // Load fresh bot configuration with personality data from database
        const { BotA, BotB } = loadDatabaseModels();
        let freshBotConfig = {};
        
        if (client.botId === "bot1") {
          const botData = await BotA.findOne();
          freshBotConfig = {
            name: botData?.name || 'Heilos',
            description: botData?.description || '',
            personality: botData?.personality || '',
            age: botData?.age || '',
            likes: botData?.likes || '',
            dislikes: botData?.dislikes || '',
            appearance: botData?.appearance || '',
            backstory: botData?.backstory || '',
            others: botData?.others || ''
          };
        } else if (client.botId === "bot2") {
          const botData = await BotB.findOne();
          freshBotConfig = {
            name: botData?.name || 'Wisteria',
            description: botData?.description || '',
            personality: botData?.personality || '',
            age: botData?.age || '',
            likes: botData?.likes || '',
            dislikes: botData?.dislikes || '',
            appearance: botData?.appearance || '',
            backstory: botData?.backstory || '',
            others: botData?.others || ''
          };
        }

        console.log(`Debug - Fresh bot config loaded for ${client.botId}:`, {
          name: freshBotConfig.name,
          personality: freshBotConfig.personality,
          age: freshBotConfig.age,
          likes: freshBotConfig.likes,
          dislikes: freshBotConfig.dislikes
        });

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
              userId: message.author.id,
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
              const bot1Messages = userData.conversationHistory.filter(msg => msg.botId === 'bot1');
              const bot2Messages = userData.conversationHistory.filter(msg => msg.botId === 'bot2');
              
              // Keep only last 30 messages per bot
              const limitedBot1Messages = bot1Messages.slice(-30);
              const limitedBot2Messages = bot2Messages.slice(-30);
              
              // Combine and sort by timestamp
              userData.conversationHistory = [...limitedBot1Messages, ...limitedBot2Messages]
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

              // Direct SQL update for conversation history to avoid JSON serialization issues
              let updateResult2 = null;
              try {
                await UserData.findOneAndUpdate(
                  { userId: message.author.id },
                  { 
                    conversationHistory: JSON.stringify(userData.conversationHistory)
                  },
                  { upsert: true }
                );
              } catch (error) {
                console.error('AI conversation history update failed:', error);
              }
              console.log(
                `Saved AI response to conversation history for ${message.author.id}. Total messages: ${userData.conversationHistory.length}`,
              );

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

          // Get current user data
          let userData = await UserData.findOne({ user_id: thread.ownerId });
          if (!userData) {
            userData = await UserData.create({
              user_id: thread.ownerId,
              username:
                thread.guild.members.cache.get(thread.ownerId)?.user
                  ?.username || "Unknown",
              xp: 0,
              level: 1,
              last_message: new Date(),
              conversation_history: [],
            });
          }

          // Award 10-15 XP for forum thread creation
          const threadXP = Math.floor(Math.random() * 6) + 10; // Random between 10-15
          const newXP = userData.xp + threadXP;
          const newLevel = Math.floor(newXP / 100) + 1;
          const previousLevel = userData.level;

          await UserData.findOneAndUpdate(
            { user_id: thread.ownerId },
            {
              xp: newXP,
              level: newLevel,
              last_message: new Date(),
            },
            { upsert: true },
          );

          console.log(
            `Awarded ${threadXP} XP to ${thread.ownerId} for creating forum thread: ${thread.name}`,
          );

          // Check for level up
          if (newLevel > previousLevel && othersData?.level_up_announcement) {
            const announcementChannelId = othersData.announcement_channel;
            let announcementChannel = null;

            if (announcementChannelId) {
              announcementChannel = thread.guild.channels.cache.get(
                announcementChannelId,
              );
            }

            // If no specific channel set or channel not found, use the thread's parent forum
            if (!announcementChannel) {
              announcementChannel = thread.parent;
            }

            if (announcementChannel) {
              const member = thread.guild.members.cache.get(thread.ownerId);
              const username = member?.user?.username || "Unknown User";

              const pastelColors = [
                "#FFB6C1",
                "#FFE4E1",
                "#E0BBE4",
                "#957DAD",
                "#D4A5A5",
                "#FFDAB9",
                "#E6E6FA",
                "#F0E68C",
              ];
              const randomColor =
                pastelColors[Math.floor(Math.random() * pastelColors.length)];

              const levelUpEmbed = new EmbedBuilder()
                .setTitle("🎉 Level Up!")
                .setDescription(
                  `Congratulations <@${thread.ownerId}>! You've reached **Level ${newLevel}**!\n\n**Bonus XP:** +${threadXP} for creating a forum thread!`,
                )
                .addFields(
                  { name: "📊 Current XP", value: `${newXP}`, inline: true },
                  {
                    name: "🎯 Next Level",
                    value: `${newLevel * 100 - newXP} XP remaining`,
                    inline: true,
                  },
                )
                .setColor(randomColor)
                .setFooter({
                  text: `Keep posting to level up! | Thread: ${thread.name}`,
                })
                .setTimestamp();

              try {
                await announcementChannel.send({ embeds: [levelUpEmbed] });
              } catch (error) {
                console.error("Failed to send level up announcement:", error);
              }
            }
          }
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

      console.log(
        `Reaction added: ${emoji} by ${user.tag} on message ${messageId}`,
      );

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
        console.log(
          `No reaction role found for emoji ${emoji} on message ${messageId}`,
        );
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

  // Login the bot
  await client.login(botToken);

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

  console.log(
    `Memory: RSS ${mb(used.rss)}MB, Heap ${mb(used.heapUsed)}/${mb(used.heapTotal)}MB, External ${mb(used.external)}MB`,
  );
};

// Start both bots with optimization
(async () => {
  try {
    console.log("Starting optimized Discord bot system...");
    
    // Performance monitoring - cleanup processed messages every 10 minutes
    setInterval(() => {
      const now = Date.now();
      const CLEANUP_THRESHOLD = 10 * 60 * 1000; // 10 minutes
      
      for (const [key, timestamp] of processedMessages.entries()) {
        if (now - timestamp > CLEANUP_THRESHOLD) {
          processedMessages.delete(key);
        }
      }
    }, 10 * 60 * 1000);

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

        console.log("System cleanup completed");
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

// Enhanced graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}, shutting down gracefully...`);

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

module.exports = { client1, client2, getRandomPastelColor };
