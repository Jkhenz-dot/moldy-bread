const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const os = require('os');
// Use existing database patterns since otherData has been migrated
const Others = require('./models/postgres/Others');
const BotA = require('./models/postgres/BotA');
const BotB = require('./models/postgres/BotB');
const LevelRoles = require('./models/postgres/LevelRoles');
const ReactionRole = require('./models/postgres/ReactionRole');
const UserData = require('./models/postgres/UserData');
const Birthday = require('./models/postgres/Birthday');
// Use existing database utilities
const database = require('./utils/database');
require('dotenv').config();

// Discord clients will be initialized by the main bot process
// Server will access them via global references once available

const app = express();
const PORT = 5000;

// Enable compression middleware for better performance
const compression = require('compression');
app.use(compression());

// Optimize Express settings
app.set('x-powered-by', false);

// Memory storage for file uploads (no disk storage)
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'avatar' && file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else if (file.fieldname.startsWith('file') || file.fieldname === 'files') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file field!'));
        }
    }
});

const uploadAvatar = upload.single('avatar');
const uploadFiles = upload.any(); // Accept any file fields

let recentActivity = [];
const startTime = Date.now();

function addActivity(message) {
    const now = new Date();
    recentActivity.unshift({
        time: now.toLocaleTimeString(),
        message: message,
        timestamp: now
    });
    
    if (recentActivity.length > 20) {
        recentActivity = recentActivity.slice(0, 20);
    }
}

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
}

function getSystemStats() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const client = global.discordClient;
    
    let totalUsers = 0;
    let onlineUsers = 0;
    let commandsRun = recentActivity.length;
    
    if (client && client.guilds) {
        client.guilds.cache.forEach(guild => {
            totalUsers += guild.memberCount || 0;
            onlineUsers += Math.floor((guild.memberCount || 0) * 0.3); // Rough estimate
        });
    }
    
    return {
        cpu: Math.floor(Math.random() * 30 + 10), // Simulated CPU usage
        ram: Math.floor(usedMem / 1024 / 1024), // RAM usage in MB
        uptime: formatUptime(Date.now() - startTime),
        totalUsers,
        onlineUsers,
        bot1Status: global.discordClient && global.discordClient.readyAt ? '🟢 Online' : '🔴 Offline',
        bot2Status: global.discordClient2 && global.discordClient2.readyAt ? '🟢 Online' : '🔴 Offline',
        commandsRun
    };
}

// Optimize JSON parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving with caching
app.use(express.static('.', {
    maxAge: '1h',
    etag: true
}));
app.use('/uploads', express.static('uploads', {
    maxAge: '24h',
    etag: true
}));

addActivity('Dashboard server started');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Test endpoint for database operations
app.get('/api/test-db', async (req, res) => {
    try {
        const botAData = await BotA.findOne({});
        const botBData = await BotB.findOne({});
        const othersData = await Others.findOne({});
        
        res.json({
            success: true,
            message: 'Database operations working',
            data: {
                botAExists: botAData !== null,
                botBExists: botBData !== null,
                othersExists: othersData !== null,
                postgresConnection: 'Connected',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Database test failed:', error);
        res.json({
            success: false,
            message: 'Database operations failed',
            error: error.message
        });
    }
});

app.get('/api/bot-data', async (req, res) => {
    try {
        const levelRoles = await LevelRoles.find();
        const reactionRoles = await ReactionRole.find();
        
        const botA = await BotA.findOne();
        const botB = await BotB.findOne();
        const others = await Others.findOne();
        
        // Create default data structure, filling with actual database values where available
        const defaultBotA = {
            name: botA?.name || 'Heilos',
            description: botA?.description || '',
            likes: botA?.likes || '',
            dislikes: botA?.dislikes || '',
            age: botA?.age || '',
            appearance: botA?.appearance || '',
            backstory: botA?.backstory || '',
            personality: botA?.personality || '',
            status: botA?.status || 'online',
            activityType: botA?.activity_type || 'playing',
            activityText: botA?.activity_text || '',
            others: botA?.others || '',
            avatarPath: botA?.avatar_path || '',
            allowedChannels: Array.isArray(botA?.allowed_channels) ? botA.allowed_channels : (botA?.allowed_channels ? [botA.allowed_channels] : []),
            blacklistedUsers: Array.isArray(botA?.blacklisted_users) ? botA.blacklisted_users : []
        };

        const defaultBotB = {
            name: botB?.name || 'Wisteria',
            description: botB?.description || '',
            likes: botB?.likes || '',
            dislikes: botB?.dislikes || '',
            age: botB?.age || '',
            appearance: botB?.appearance || '',
            backstory: botB?.backstory || '',
            personality: botB?.personality || '',
            status: botB?.status || 'online',
            activityType: botB?.activity_type || 'playing',
            activityText: botB?.activity_text || '',
            avatarPath: botB?.avatar_path || '',
            allowedChannels: Array.isArray(botB?.allowed_channels) ? botB.allowed_channels : (botB?.allowed_channels ? [botB.allowed_channels] : []),
            blacklistedUsers: Array.isArray(botB?.blacklisted_users) ? botB.blacklisted_users : []
        };

        return res.json({
            success: true,
            data: {
                bot1: defaultBotA,
                bot2: defaultBotB,
                xpSettings: {
                    enabled: others?.xp_enabled || false,
                    minXp: others?.min_xp || 1,
                    maxXp: others?.max_xp || 15,
                    xpCooldown: others?.xp_cooldown || 60000,
                    levelUpAnnouncement: others?.level_up_announcement || false,
                    announcementChannel: others?.announcement_channel || ''
                },
                levelRoles: levelRoles || [],
                reactionRoles: reactionRoles || [],
                welcomer: {
                    enabled: others?.welcomer_enabled || false,
                    channelId: others?.welcomer_channel || '',
                    message: others?.welcomer_message || 'Welcome {user} to the server!',
                    useEmbed: others?.welcomer_embed_enabled || false,
                    embedTitle: others?.welcomer_embed_title || 'Welcome!',
                    embedDescription: others?.welcomer_embed_description || 'Welcome {user} to our server!',
                    embedColor: others?.welcomer_embed_color || '#00ff00'
                },
                forumAutoReact: {
                    enabled: others?.forum_auto_react_enabled || false,
                    allForums: others?.forum_auto_react_all_forums || false,
                    selectedForum: (() => {
                        try {
                            const forumData = others?.forum_channels ? JSON.parse(others.forum_channels) : {};
                            return forumData.selectedForum || '';
                        } catch (e) {
                            return '';
                        }
                    })(),
                    bot1EmojiList: (() => {
                        try {
                            const forumData = others?.forum_channels ? JSON.parse(others.forum_channels) : {};
                            return forumData.bot1EmojiList || '';
                        } catch (e) {
                            return '';
                        }
                    })(),
                    bot2EmojiList: (() => {
                        try {
                            const forumData = others?.forum_channels ? JSON.parse(others.forum_channels) : {};
                            return forumData.bot2EmojiList || '';
                        } catch (e) {
                            return '';
                        }
                    })(),
                    messageReact: { 
                        enabled: others?.message_react_enabled || false, 
                        messageId: others?.message_react_message_id || '', 
                        botId: others?.message_react_bot_id || 'bot1' 
                    }
                },
                customRankCard: {
                    backgroundColor: others?.rank_card_bg_color || '#23272a',
                    progressBarColor: others?.rank_card_progress_color || '#7289da',
                    textColor: others?.rank_card_text_color || '#ffffff',
                    accentColor: others?.rank_card_accent_color || '#99aab5',
                    cardStyle: others?.rank_card_style || 'default'
                }
            }
        });
    } catch (error) {
        console.error('Error loading bot data:', error);
        res.json({
            success: false,
            message: 'Failed to load bot data: ' + error.message
        });
    }
});

app.get('/api/dashboard-stats', async (req, res) => {
    try {
        const client1 = global.discordClient1;
        const client2 = global.discordClient2;
        const stats = getSystemStats();
        
        let guilds = [];
        let guildCount = 0;
        
        // Prefer client1 for guild data, fallback to client2
        const primaryClient = client1 || client2;
        
        if (primaryClient && primaryClient.guilds) {
            guildCount = primaryClient.guilds.cache.size;
            guilds = primaryClient.guilds.cache.map(guild => ({
                id: guild.id,
                name: guild.name,
                memberCount: guild.memberCount || 0
            })).slice(0, 10); // Limit to 10 guilds for display
        }
        
        // Only log guild stats occasionally to reduce spam
        if (Math.random() < 0.1) { // Log only 10% of the time
            console.log(`Dashboard stats: ${guildCount} guilds found`);
            if (guilds.length > 0) {
                console.log(`Available guilds: ${guilds.map(g => `${g.name} (${g.id})`).join(', ')}`);
            }
        }
        
        const targetGuildId = process.env.GUILD_ID;
        
        res.json({
            success: true,
            stats: {
                cpu: stats.cpu,
                ram: stats.ram,
                uptime: stats.uptime,
                guildCount: guildCount,
                guilds: guilds,
                bot1Status: client1 && client1.readyAt ? '🟢 Online' : '🔴 Offline',
                bot2Status: client2 && client2.readyAt ? '🟢 Online' : '🔴 Offline',
                bot1Name: client1?.user?.username || 'Assistant',
                bot2Name: client2?.user?.username || 'Assistant',
                recentActivity: recentActivity.slice(0, 10)
            },
            targetGuildId
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.json({
            success: false,
            message: 'Failed to fetch dashboard stats: ' + error.message
        });
    }
});

app.get('/api/guild-data', async (req, res) => {
    try {
        const client = global.discordClient1;
        const serverId = req.query.serverId;
        const guildData = { channels: [], roles: [], emojis: [] };
        
        console.log(`Guild data request for serverId: ${serverId}`);
        
        if (!client) {
            console.error('Discord client not available');
            return res.json({
                success: false,
                message: 'Discord client not available'
            });
        }
        
        if (!serverId) {
            console.error('Server ID not provided');
            return res.json({
                success: false,
                message: 'Server ID not provided'
            });
        }
        
        if (!client.guilds || !client.guilds.cache) {
            console.error('Guild cache not available');
            return res.json({
                success: false,
                message: 'Guild cache not available'
            });
        }
        
        const guild = client.guilds.cache.get(serverId);
        if (!guild) {
            console.error(`Guild not found for serverId: ${serverId}`);
            console.log(`Available guilds: ${client.guilds.cache.map(g => `${g.name} (${g.id})`).join(', ')}`);
            return res.json({
                success: false,
                message: `Guild not found for serverId: ${serverId}`
            });
        }
        
        console.log(`Loading guild data for: ${guild.name} (${guild.id})`);
        
        // Load channels
        if (guild.channels && guild.channels.cache) {
            guild.channels.cache.forEach(channel => {
                // Include text, voice, stage, announcement, forum channels
                if ([0, 2, 5, 13, 15].includes(channel.type)) {
                    let channelIcon = '';
                    switch (channel.type) {
                        case 0: channelIcon = '💬'; break; // Text
                        case 2: channelIcon = '🔊'; break; // Voice
                        case 5: channelIcon = '📢'; break; // Announcement
                        case 13: channelIcon = '🎤'; break; // Stage
                        case 15: channelIcon = '🗣️'; break; // Forum
                    }
                    
                    guildData.channels.push({
                        id: channel.id,
                        name: channel.name,
                        type: channel.type,
                        icon: channelIcon
                    });
                }
            });
        }
        
        // Load roles
        if (guild.roles && guild.roles.cache) {
            guild.roles.cache.forEach(role => {
                if (role.id !== guild.id) { // Exclude @everyone role
                    guildData.roles.push({
                        id: role.id,
                        name: role.name,
                        color: role.hexColor
                    });
                }
            });
        }
        
        // Load emojis
        if (guild.emojis && guild.emojis.cache) {
            guild.emojis.cache.forEach(emoji => {
                guildData.emojis.push({
                    id: emoji.id,
                    name: emoji.name,
                    animated: emoji.animated
                });
            });
        }
        
        console.log(`Guild data loaded: ${guildData.channels.length} channels, ${guildData.roles.length} roles, ${guildData.emojis.length} emojis`);
        
        res.json({
            success: true,
            data: guildData
        });
    } catch (error) {
        console.error('Error fetching guild data:', error);
        res.json({
            success: false,
            message: 'Failed to fetch guild data: ' + error.message
        });
    }
});

app.post('/api/update-general', uploadAvatar, async (req, res) => {
    try {
        const { name, description, status, activityType, activityText, allowedChannels } = req.body;
        
        // Get others data
        const othersData = await Others.findOne({});
        
        if (name) {
            // Update both bots with the name
            await BotA.findOneAndUpdate({}, { name: name }, { upsert: true });
            await BotB.findOneAndUpdate({}, { name: name }, { upsert: true });
            addActivity(`Bot name updated to: ${name}`);
            
            if (global.discordClient) {
                try {
                    await global.discordClient.user.setUsername(name);
                } catch (error) {
                    console.log('Note: Discord username change limited to 2 per hour');
                }
            }
        }
        
        if (description !== undefined) {
            // Update both bots with the description
            await BotA.findOneAndUpdate({}, { description: description }, { upsert: true });
            await BotB.findOneAndUpdate({}, { description: description }, { upsert: true });
            addActivity(`Bot description updated`);
            
            if (global.discordClient) {
                try {
                    await global.discordClient.application.edit({
                        description: description
                    });
                    console.log('Bot description updated successfully');
                    
                    // Force refresh application data
                    await global.discordClient.application.fetch(true);
                    
                    // Update bot activity to trigger client refresh
                    await global.discordClient.user.setActivity(description || 'Bot updated', { 
                        type: getActivityType(othersData?.activityType || 'playing') 
                    });
                } catch (error) {
                    console.log('Note: Bot description update failed:', error.message);
                }
            }
        }
        
        if (status) {
            if (othersData) {
                await Others.findOneAndUpdate({}, { status: status });
            } else {
                await Others.create({ status: status });
            }
            addActivity(`Bot status changed to: ${status}`);
        }
        
        if (activityType) {
            if (othersData) {
                await Others.findOneAndUpdate({}, { activityType: activityType });
            } else {
                await Others.create({ activityType: activityType });
            }
        }
        
        if (activityText) {
            if (othersData) {
                await Others.findOneAndUpdate({}, { activityText: activityText });
            } else {
                await Others.create({ activityText: activityText });
            }
            addActivity(`Bot activity updated: ${activityType} ${activityText}`);
        }
        
        // Update BotA with new data
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (activityType !== undefined) updateData.activityType = activityType;
        if (activityText !== undefined) updateData.activityText = activityText;
        if (allowedChannels !== undefined) {
            updateData.allowed_channels = allowedChannels;
            
            if (allowedChannels === '') {
                addActivity(`Bot 1 allowed channels cleared - can use all channels`);
            } else {
                addActivity(`Bot 1 allowed channel updated: ${allowedChannels}`);
            }
        }
        
        await BotA.findOneAndUpdate({}, updateData, { upsert: true });
        
        if (req.file && req.file.fieldname === 'avatar') {
            // Convert file buffer to base64 for storage
            const avatarBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            await BotA.findOneAndUpdate({}, { avatarPath: avatarBase64 }, { upsert: true });
            addActivity('Bot avatar updated');
            
            // Update Discord bot avatar
            if (global.discordClient) {
                try {
                    await global.discordClient.user.setAvatar(req.file.buffer);
                    console.log('Discord bot avatar updated successfully');
                } catch (error) {
                    console.log('Note: Discord avatar update failed:', error.message);
                }
            }
        }
        
        if (global.discordClient) {
            try {
                const presenceData = {
                    status: getStatusType(status || 'online'),
                    activities: []
                };

                if (activityText) {
                    const activity = {
                        name: activityText,
                        type: getActivityType(activityType || 'playing')
                    };
                    
                    // Add URL for streaming activity type
                    if (activityType === 'streaming') {
                        activity.url = 'https://twitch.tv/placeholder'; // Required for streaming
                    }
                    
                    presenceData.activities.push(activity);
                }

                await global.discordClient.user.setPresence(presenceData);
            } catch (error) {
                console.error('Error updating Discord presence:', error);
            }
        }
        
        res.json({
            success: true,
            message: 'General settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating general settings:', error);
        res.json({
            success: false,
            message: 'Failed to update general settings'
        });
    }
});

function getActivityType(type) {
    const types = {
        'playing': 0,
        'streaming': 1,
        'listening': 2,
        'watching': 3,
        'competing': 5
    };
    return types[type] || 0;
}

function getStatusType(status) {
    const statusMap = {
        'online': 'online',
        'idle': 'idle',
        'dnd': 'dnd',
        'invisible': 'invisible',
        'mobile': 'online' // Mobile status shows as online with mobile indicator
    };
    return statusMap[status] || 'online';
}

app.post('/api/update-bot1-personality', async (req, res) => {
    try {
        const { likes, dislikes, age, appearance, backstory, personality, others } = req.body;
        
        // Get bot data
        const botAData = await BotA.findOne() || {};
        const othersData = await Others.findOne({});
        
        // Parse existing bot1 config
        const parseJsonField = (field, defaultValue = {}) => {
            try {
                return typeof field === 'string' ? JSON.parse(field) : (field || defaultValue);
            } catch (error) {
                return defaultValue;
            }
        };
        
        const existingBot1Config = parseJsonField(botAData, {});

        const updateData = {};
        if (likes !== undefined) updateData.likes = likes;
        if (dislikes !== undefined) updateData.dislikes = dislikes;
        if (age !== undefined) updateData.age = age;
        if (appearance !== undefined) updateData.appearance = appearance;
        if (backstory !== undefined) updateData.backstory = backstory;
        if (personality !== undefined) updateData.personality = personality;
        if (others !== undefined) updateData.others = others;
        
        await BotA.findOneAndUpdate({}, updateData, { upsert: true });
        addActivity('Bot 1 personality updated');
        
        res.json({
            success: true,
            message: 'Bot 1 personality settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating Bot 1 personality:', error);
        res.json({
            success: false,
            message: 'Failed to update Bot 1 personality settings'
        });
    }
});

app.post('/api/update-bot2-personality', async (req, res) => {
    try {
        const { likes, dislikes, age, appearance, backstory, personality, others } = req.body;
        
        // Get bot data
        const botBData = await BotB.findOne() || {};
        const othersData = await Others.findOne({});
        
        // Parse existing bot2 config
        const parseJsonField = (field, defaultValue = {}) => {
            try {
                return typeof field === 'string' ? JSON.parse(field) : (field || defaultValue);
            } catch (error) {
                return defaultValue;
            }
        };
        
        const existingBot2Config = parseJsonField(botBData, {});

        const updateData = {};
        if (likes !== undefined) updateData.likes = likes;
        if (dislikes !== undefined) updateData.dislikes = dislikes;
        if (age !== undefined) updateData.age = age;
        if (appearance !== undefined) updateData.appearance = appearance;
        if (backstory !== undefined) updateData.backstory = backstory;
        if (personality !== undefined) updateData.personality = personality;
        if (others !== undefined) updateData.others = others;
        
        await BotB.findOneAndUpdate({}, updateData, { upsert: true });
        addActivity('Bot 2 personality updated');
        
        res.json({
            success: true,
            message: 'Bot 2 personality settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating Bot 2 personality:', error);
        res.json({
            success: false,
            message: 'Failed to update Bot 2 personality settings'
        });
    }
});


app.post('/api/update-xp-settings', async (req, res) => {
    try {
        const { minXp, maxXp, xpCooldown, serverId } = req.body;
        
        // Get others data
        const othersData = await Others.findOne({});
        
        // Parse existing XP settings
        const parseJsonField = (field, defaultValue = {}) => {
            try {
                return typeof field === 'string' ? JSON.parse(field) : (field || defaultValue);
            } catch (error) {
                return defaultValue;
            }
        };
        
        const existingXpSettings = parseJsonField(othersData?.xp_settings, {
            enabled: true,
            minXp: 1,
            maxXp: 15,
            xpCooldown: 60000,
            levelUpAnnouncement: true,
            announcementChannel: ''
        });
        
        await Others.findOneAndUpdate({}, { 
            min_xp: minXp || 1,
            max_xp: maxXp || 15,
            xp_cooldown: xpCooldown || 60000
        }, { upsert: true });
        addActivity(`XP settings updated: ${minXp}-${maxXp} XP, ${Math.floor(xpCooldown/1000)}s cooldown`);
        
        res.json({
            success: true,
            message: 'XP settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating XP settings:', error);
        res.json({
            success: false,
            message: 'Failed to update XP settings'
        });
    }
});

app.post('/api/update-announcement-settings', async (req, res) => {
    try {
        const { levelAnnouncements, announcementChannel, serverId } = req.body;
        
        // Get others data
        const othersData = await Others.findOne({});
        
        // Parse existing XP settings
        const parseJsonField = (field, defaultValue = {}) => {
            try {
                return typeof field === 'string' ? JSON.parse(field) : (field || defaultValue);
            } catch (error) {
                return defaultValue;
            }
        };
        
        const existingXpSettings = parseJsonField(othersData?.xp_settings, {
            enabled: true,
            minXp: 1,
            maxXp: 15,
            xpCooldown: 60000,
            levelUpAnnouncement: true,
            announcementChannel: ''
        });
        
        const updatedXpSettings = {
            ...existingXpSettings,
            levelUpAnnouncement: levelAnnouncements !== false,
            announcementChannel: announcementChannel || ''
        };
        
        await Others.findOneAndUpdate({}, { 
            level_up_announcement: levelAnnouncements !== false,
            announcement_channel: announcementChannel || ''
        }, { upsert: true });
        addActivity(`Level announcements ${levelAnnouncements ? 'enabled' : 'disabled'}`);
        
        res.json({
            success: true,
            message: 'Announcement settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating announcement settings:', error);
        res.json({
            success: false,
            message: 'Failed to update announcement settings'
        });
    }
});

app.post('/api/update-role-rewards', async (req, res) => {
    try {
        const { roleRewards, serverId } = req.body;
        
        if (roleRewards && Array.isArray(roleRewards)) {
            await LevelRoles.deleteMany({});
            
            for (const role of roleRewards) {
                await LevelRoles.create({
                    guildId: 'global', // Using global since data is shared
                    level: role.level,
                    roleId: role.roleId
                });
            }
        }
        
        addActivity(`Level role rewards updated: ${roleRewards.length} roles`);
        
        res.json({
            success: true,
            message: 'Role rewards updated successfully'
        });
    } catch (error) {
        console.error('Error updating role rewards:', error);
        res.json({
            success: false,
            message: 'Failed to update role rewards'
        });
    }
});

app.post('/api/update-rank-card', async (req, res) => {
    try {
        const { backgroundColor, progressBarColor, textColor, accentColor, cardStyle, serverId } = req.body;
        
        // Get others data
        const othersData = await Others.findOne({});
        
        if (!othersData?.customRankCard) {
            if (othersData) {
                await Others.findOneAndUpdate({}, { customRankCard: {} });
            } else {
                await Others.create({ customRankCard: {} });
            }
        }
        
        // Get current BotA data
        const currentBotAData = await BotA.findOne() || {};
        
        const updatedBot1RankCardConfig = {
            ...currentBotAData,
            customRankCard: {
                ...currentBotAData.customRankCard,
                backgroundColor: backgroundColor || '#23272a',
                progressBarColor: progressBarColor || '#7289da',
                textColor: textColor || '#ffffff',
                accentColor: accentColor || '#99aab5',
                cardStyle: cardStyle || 'default'
            }
        };
        
        // TODO: Fix this update call
        addActivity('Custom rank card settings updated');
        
        res.json({
            success: true,
            message: 'Rank card settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating rank card settings:', error);
        res.json({
            success: false,
            message: 'Failed to update rank card settings'
        });
    }
});

app.post('/api/update-levels', async (req, res) => {
    try {
        const { minXp, maxXp, xpCooldown, levelAnnouncements, announcementChannel, levelRoles } = req.body;
        
        // Get others data
        const othersData = await Others.findOne({});
        
        if (!othersData?.xpSettings) {
            if (othersData) {
                await Others.findOneAndUpdate({}, { xpSettings: {} });
            } else {
                await Others.create({ xpSettings: {} });
            }
        }
        
        // Get current BotA data
        const currentBotAData = await BotA.findOne() || {};
        
        const updatedBot1XPCompleteConfig = {
            ...currentBotAData,
            xpSettings: {
                ...currentBotAData.xpSettings,
                minXp: minXp || 1,
                maxXp: maxXp || 15,
                xpCooldown: xpCooldown || 60000,
                levelUpAnnouncement: levelAnnouncements !== false,
                announcementChannel: announcementChannel || '',
                enabled: true
            }
        };
        
        // TODO: Fix this update call
        
        if (levelRoles && Array.isArray(levelRoles)) {
            await LevelRoles.deleteMany({});
            
            for (const role of levelRoles) {
                await LevelRoles.create({
                    guildId: 'global', // Using global since data is shared
                    level: role.level,
                    roleId: role.roleId
                });
            }
        }
        
        addActivity('Level system settings updated');
        
        res.json({
            success: true,
            message: 'Level settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating level settings:', error);
        res.json({
            success: false,
            message: 'Failed to update level settings'
        });
    }
});

app.post('/api/update-auto-react', async (req, res) => {
    try {
        const { forumAutoReact } = req.body;
        
        if (!forumAutoReact) {
            return res.json({
                success: false,
                message: 'No forum auto-react data provided'
            });
        }
        
        // Get current Others data
        const currentOthers = await Others.findOne({});
        
        if (!currentOthers) {
            // Create new Others record if it doesn't exist
            await Others.create({
                forum_auto_react_enabled: forumAutoReact.allForums || false,
                forum_channels: JSON.stringify({
                    selectedForum: forumAutoReact.selectedForum || '',
                    bot1EmojiList: forumAutoReact.bot1EmojiList || '',
                    bot2EmojiList: forumAutoReact.bot2EmojiList || ''
                })
            });
            
            addActivity('Forum auto-react settings created');
        } else {
            // Update existing Others record
            await Others.findOneAndUpdate({}, {
                forum_auto_react_enabled: forumAutoReact.allForums || false,
                forum_channels: JSON.stringify({
                    selectedForum: forumAutoReact.selectedForum || '',
                    bot1EmojiList: forumAutoReact.bot1EmojiList || '',
                    bot2EmojiList: forumAutoReact.bot2EmojiList || ''
                })
            });
            
            addActivity('Forum auto-react settings updated');
        }
        
        res.json({
            success: true,
            message: 'Forum auto-react settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating forum auto-react settings:', error);
        res.json({
            success: false,
            message: 'Failed to update forum auto-react settings'
        });
    }
});

app.post('/api/react-to-message', async (req, res) => {
    try {
        const { messageId, emojiList } = req.body;
        const client = global.discordClient;
        
        if (!client || !messageId || !emojiList) {
            return res.json({
                success: false,
                message: 'Missing required fields or bot not connected'
            });
        }
        
        const emojis = emojiList.split(',').map(e => e.trim());
        
        let message = null;
        for (const guild of client.guilds.cache.values()) {
            for (const channel of guild.channels.cache.values()) {
                if (channel.isTextBased()) {
                    try {
                        message = await channel.messages.fetch(messageId);
                        if (message) break;
                    } catch (err) {
                    }
                }
            }
            if (message) break;
        }
        
        if (!message) {
            return res.json({
                success: false,
                message: 'Message not found'
            });
        }
        
        for (const emoji of emojis) {
            try {
                await message.react(emoji);
            } catch (err) {
                console.error(`Failed to react with ${emoji}:`, err);
            }
        }
        
        addActivity(`Reacted to message ${messageId} with ${emojis.length} emojis`);
        
        res.json({
            success: true,
            message: 'Successfully reacted to message'
        });
    } catch (error) {
        console.error('Error reacting to message:', error);
        res.json({
            success: false,
            message: 'Failed to react to message'
        });
    }
});

app.post('/api/update-reactions', async (req, res) => {
    try {
        const { reactionRoles } = req.body;
        
        await ReactionRole.deleteMany({});
        
        for (const reaction of reactionRoles) {
            await ReactionRole.create({
                messageId: reaction.messageId,
                emoji: reaction.emoji,
                roles: reaction.roles
            });
        }
        
        addActivity(`Reaction roles updated: ${reactionRoles.length} configurations`);
        
        res.json({
            success: true,
            message: 'Reaction roles updated successfully'
        });
    } catch (error) {
        console.error('Error updating reaction roles:', error);
        res.json({
            success: false,
            message: 'Failed to update reaction roles'
        });
    }
});

// React to specific message endpoint with bot selection
app.post('/api/react-to-message', async (req, res) => {
    try {
        const { channelId, messageId, emojis, botId } = req.body;
        const client = botId === 'bot2' ? global.discordClient2 : global.discordClient1;
        
        if (!client || !channelId || !messageId) {
            return res.json({
                success: false,
                message: 'Missing required fields or bot not connected'
            });
        }
        
        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            return res.json({
                success: false,
                message: 'Channel not found'
            });
        }
        
        const message = await channel.messages.fetch(messageId);
        if (!message) {
            return res.json({
                success: false,
                message: 'Message not found'
            });
        }
        
        const emojiList = emojis ? emojis.split(',').map(e => e.trim()).filter(e => e) : ['👍', '❤️', '😊'];
        
        for (const emoji of emojiList) {
            try {
                await message.react(emoji);
                await new Promise(resolve => setTimeout(resolve, 500)); // Delay between reactions
            } catch (error) {
                console.log(`Failed to react with ${emoji}:`, error.message);
            }
        }
        
        addActivity(`${botId === 'bot2' ? 'Bot 2' : 'Bot 1'} reacted to message with ${emojiList.length} emojis`);
        
        res.json({
            success: true,
            message: 'Reactions added successfully'
        });
    } catch (error) {
        console.error('Error adding reactions:', error);
        res.json({
            success: false,
            message: 'Failed to add reactions'
        });
    }
});

// Bot Configuration Data Endpoint
app.get('/api/bot-config', async (req, res) => {
    try {
        const botA = await BotA.findOne();
        const botB = await BotB.findOne();
        
        res.json({
            success: true,
            data: {
                bot1: {
                    name: botA?.name || '',
                    description: botA?.description || '',
                    status: botA?.status || 'online',
                    activityType: botA?.activity_type || 'playing',
                    activityText: botA?.activity_text || '',
                    allowedChannels: botA?.allowed_channels || '',
                    personality: botA?.personality || '',
                    appearance: botA?.appearance || '',
                    backstory: botA?.backstory || '',
                    likes: botA?.likes || '',
                    dislikes: botA?.dislikes || '',
                    others: botA?.others || '',
                    age: botA?.age || ''
                },
                bot2: {
                    name: botB?.name || '',
                    description: botB?.description || '',
                    status: botB?.status || 'online',
                    activityType: botB?.activity_type || 'playing',
                    activityText: botB?.activity_text || '',
                    allowedChannels: botB?.allowed_channels || '',
                    personality: botB?.personality || '',
                    appearance: botB?.appearance || '',
                    backstory: botB?.backstory || '',
                    likes: botB?.likes || '',
                    dislikes: botB?.dislikes || '',
                    others: botB?.others || '',
                    age: botB?.age || ''
                }
            }
        });
    } catch (error) {
        console.error('Error loading bot configuration:', error);
        res.json({
            success: false,
            message: 'Failed to load bot configuration'
        });
    }
});

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
    }
    
    console.error('Server error:', error);
    res.json({
        success: false,
        message: 'Internal server error'
    });
});

// Bot 1 General Settings
app.post('/api/update-bot1-general', uploadAvatar, async (req, res) => {
    try {
        const { name, description, status, activityType, activityText, allowedChannels } = req.body;
        
        let botA = await BotA.findOne();
        if (!botA) {
            botA = await BotA.create({});
        }
        
        if (!botA) {
            botA = await BotA.create({});
        }
        
        if (name) {
            await BotA.findOneAndUpdate({}, { name: name }, { upsert: true });
            addActivity(`Bot 1 name updated to: ${name}`);
            
            if (global.discordClient1) {
                try {
                    await global.discordClient1.user.setUsername(name);
                } catch (error) {
                    console.log('Note: Discord username change limited to 2 per hour');
                }
            }
        }
        
        if (description !== undefined) {
            botA.description = description;
            addActivity(`Bot 1 description updated`);
            
            if (global.discordClient1) {
                try {
                    await global.discordClient1.application.edit({
                        description: description
                    });
                    console.log('Bot 1 description updated successfully');
                } catch (error) {
                    console.log('Note: Bot 1 description update failed:', error.message);
                }
            }
        }
        
        // Get existing bot1 config from database
        const existingBot1Data = await BotA.findOne() || {};
        
        const existingBot1Config = {
            name: existingBot1Data.name || 'AI Assistant',
            description: existingBot1Data.description || '',
            status: existingBot1Data.status || 'online',
            activityType: existingBot1Data.activityType || 'playing',
            activityText: existingBot1Data.activityText || '',
            allowedChannels: existingBot1Data.allowedChannels || ''
        };

        const updatedBot1Config = {
            name: name || existingBot1Config.name,
            description: description !== undefined ? description : existingBot1Config.description,
            status: status || existingBot1Config.status,
            activityType: activityType || existingBot1Config.activityType,
            activityText: activityText !== undefined ? activityText : existingBot1Config.activityText,
            allowedChannels: allowedChannels !== undefined ? allowedChannels : existingBot1Config.allowedChannels
        };
        
        if (status) {
            addActivity(`Bot 1 status changed to: ${status}`);
        }
        
        if (activityText) {
            addActivity(`Bot 1 activity updated: ${activityType} ${activityText}`);
        }
        
        if (allowedChannels !== undefined) {
            if (allowedChannels === '') {
                addActivity(`Bot 1 allowed channels cleared - can use all channels`);
            } else {
                addActivity(`Bot 1 allowed channel updated: 1 channel restricted`);
            }
        }
        
        // Update BotA with new data
        // Handle avatar upload
        if (req.file && req.file.fieldname === 'avatar') {
            const avatarBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            updatedBot1Config.avatarPath = avatarBase64;
            addActivity('Bot 1 avatar updated');
            
            if (global.discordClient1) {
                try {
                    await global.discordClient1.user.setAvatar(req.file.buffer);
                    console.log('Discord Bot 1 avatar updated successfully');
                } catch (error) {
                    console.log('Note: Discord Bot 1 avatar update failed:', error.message);
                }
            }
        }
        
        // Save updated config to database (single save operation)
        await BotA.findOneAndUpdate({}, updatedBot1Config, { upsert: true });
        
        // Update Discord presence after saving data
        if (global.discordClient1) {
            try {
                // Use the updated configuration values
                const finalStatus = updatedBot1Config.status;
                const finalActivityText = updatedBot1Config.activityText;
                const finalActivityType = updatedBot1Config.activityType;
                
                const presenceData = {
                    status: getStatusType(finalStatus),
                    activities: []
                };
                
                if (finalActivityText) {
                    const activity = {
                        name: finalActivityText,
                        type: getActivityType(finalActivityType || 'playing')
                    };
                    
                    // Handle streaming status specially
                    if (finalStatus === 'streaming' && finalActivityType === 'streaming') {
                        activity.url = 'https://twitch.tv/placeholder'; // Required for streaming
                    }
                    
                    presenceData.activities.push(activity);
                }

                await global.discordClient1.user.setPresence(presenceData);
                console.log(`${botA?.name || 'Bot A'} presence updated: ${finalStatus} -> ${presenceData.status}, activity: ${finalActivityText || 'none'}`);
            } catch (error) {
                console.error('Error updating Discord Bot 1 presence:', error);
            }
        }
        
        res.json({
            success: true,
            message: 'Bot 1 general settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating Bot 1 general settings:', error);
        res.json({
            success: false,
            message: 'Failed to update Bot 1 general settings'
        });
    }
});

// Bot 2 General Settings
app.post('/api/update-bot2-general', uploadAvatar, async (req, res) => {
    try {
        const { name, description, status, activityType, activityText, allowedChannels } = req.body;
        
        let botB = await BotB.findOne();
        if (!botB) {
            botB = await BotB.create({});
        }
        
        if (name) {
            await BotB.findOneAndUpdate({}, { name: name }, { upsert: true });
            addActivity(`Bot 2 name updated to: ${name}`);
            
            if (global.discordClient2) {
                try {
                    await global.discordClient2.user.setUsername(name);
                } catch (error) {
                    console.log('Note: Discord username change limited to 2 per hour');
                }
            }
        }
        
        // Update BotB with new data
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) {
            updateData.description = description;
            addActivity(`Bot 2 description updated`);
            
            if (global.discordClient2) {
                try {
                    await global.discordClient2.application.edit({
                        description: description
                    });
                    console.log('Bot 2 description updated successfully');
                } catch (error) {
                    console.log('Note: Bot 2 description update failed:', error.message);
                }
            }
        }
        if (status !== undefined) {
            updateData.status = status;
            addActivity(`Bot 2 status changed to: ${status}`);
        }
        if (activityType !== undefined) updateData.activityType = activityType;
        if (activityText !== undefined) {
            updateData.activityText = activityText;
            addActivity(`Bot 2 activity updated: ${activityType} ${activityText}`);
        }
        if (allowedChannels !== undefined) {
            updateData.allowed_channels = allowedChannels;
            if (allowedChannels === '') {
                addActivity(`Bot 2 allowed channels cleared - can use all channels`);
            } else {
                addActivity(`Bot 2 allowed channel updated: ${allowedChannels}`);
            }
        }
        
        await BotB.findOneAndUpdate({}, updateData, { upsert: true });
        
        if (req.file && req.file.fieldname === 'avatar') {
            const avatarBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            await BotB.findOneAndUpdate({}, { avatarPath: avatarBase64 }, { upsert: true });
            addActivity('Bot 2 avatar updated');
            
            if (global.discordClient2) {
                try {
                    await global.discordClient2.user.setAvatar(req.file.buffer);
                    console.log('Discord Bot 2 avatar updated successfully');
                } catch (error) {
                    console.log('Note: Discord Bot 2 avatar update failed:', error.message);
                }
            }
        }
        
        // Update Discord presence after saving data
        if (global.discordClient2) {
            try {
                // Use the new values from the request, fallback to saved values
                const finalStatus = status || BotB.status || 'online';
                const finalActivityText = activityText || BotB.activityText;
                const finalActivityType = activityType || BotB.activityType;
                
                const presenceData = {
                    status: getStatusType(finalStatus),
                    activities: []
                };
                
                if (finalActivityText) {
                    const activity = {
                        name: finalActivityText,
                        type: getActivityType(finalActivityType || 'playing')
                    };
                    
                    // Add URL for streaming activity type
                    if (finalActivityType === 'streaming') {
                        activity.url = 'https://twitch.tv/placeholder'; // Required for streaming
                    }
                    
                    presenceData.activities.push(activity);
                }

                await global.discordClient2.user.setPresence(presenceData);
                console.log(`Bot presence updated: ${finalStatus} -> ${presenceData.status}, activity: ${finalActivityText || 'none'}`);
            } catch (error) {
                console.error('Error updating bot presence:', error);
            }
        }
        
        res.json({
            success: true,
            message: 'Bot 2 general settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating Bot 2 general settings:', error);
        res.json({
            success: false,
            message: 'Failed to update Bot 2 general settings'
        });
    }
});

// Bot 1 Personality Settings
app.post('/api/update-bot1-personality', async (req, res) => {
    try {
        const { age, appearance, personality, likes, dislikes, backstory, others } = req.body;
        
        // Get others data
        const othersData = await Others.findOne({});
        
        if (!BotA) {
            BotA = {};
        }
        
        const updatedBot1AIConfig = {

            ...(await BotA.findOne() || {}),
            age: age || '',
            appearance: appearance || '',
            personality: personality || '',
            likes: likes || '',
            dislikes: dislikes || '',
            backstory: backstory || '',
            others: others || ''
        };
        
        // TODO: Fix this update call
        addActivity('Bot 1 AI personality updated');
        
        res.json({
            success: true,
            message: 'Bot 1 AI Details updated successfully'
        });
    } catch (error) {
        console.error('Error updating Bot 1 personality settings:', error);
        res.json({
            success: false,
            message: 'Failed to update Bot 1 AI Details'
        });
    }
});

// Bot 2 Personality Settings
app.post('/api/update-bot2-personality', async (req, res) => {
    try {
        const { age, appearance, personality, likes, dislikes, backstory, others } = req.body;
        
        // Get others data
        const othersData = await Others.findOne({});
        
        if (!BotB) {
            BotB = {};
        }
        
        const updatedBot2AIConfig = {
            ...BotB,
            age: age || '',
            appearance: appearance || '',
            personality: personality || '',
            likes: likes || '',
            dislikes: dislikes || '',
            backstory: backstory || '',
            others: others || ''
        };
        
        // TODO: Fix this update call
        addActivity('Bot 2 AI personality updated');
        
        res.json({
            success: true,
            message: 'Bot 2 AI Details updated successfully'
        });
    } catch (error) {
        console.error('Error updating Bot 2 personality settings:', error);
        res.json({
            success: false,
            message: 'Failed to update Bot 2 AI Details'
        });
    }
});

app.post('/api/update-welcomer', async (req, res) => {
    try {
        const { enabled, channelId, useEmbed, message, embedTitle, embedDescription, embedColor } = req.body;
        
        // Get others data
        const othersData = await Others.findOne({});
        
        const updatedBot1WelcomerConfig = {

            ...(await BotA.findOne() || {}),
            welcomer: {
                enabled: enabled || false,
                channelId: channelId || '',
                message: message || 'Welcome {user} to the server!',
                useEmbed: useEmbed || false,
                embedTitle: embedTitle || 'Welcome!',
                embedDescription: embedDescription || 'Welcome {user} to our server!',
                embedColor: embedColor || '#00ff00'
            }
        };
        
        // TODO: Fix this update call
        addActivity('Welcomer settings updated');
        
        res.json({
            success: true,
            message: 'Welcomer settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating welcomer settings:', error);
        res.json({
            success: false,
            message: 'Failed to update welcomer settings'
        });
    }
});

app.post('/api/update-reactions', async (req, res) => {
    try {
        const { forumAutoReact, reactionRoles } = req.body;
        
        // Get others data
        const othersData = await Others.findOne({});
        
        if (forumAutoReact) {
            const forumChannelsData = JSON.stringify({
                enabled: true,
                allForums: forumAutoReact.allForums || false,
                messageReact: {
                    enabled: forumAutoReact.messageReact?.enabled || false,
                    messageId: forumAutoReact.messageReact?.messageId || ''
                }
            });
            
            await Others.findOneAndUpdate({}, { 
                forumAutoReactEnabled: true,
                forumChannels: forumChannelsData
            }, { upsert: true });
        }
        
        if (reactionRoles && reactionRoles.length > 0) {
            await ReactionRole.deleteMany({});
            
            for (const rr of reactionRoles) {
                if (rr.messageId && rr.emoji && rr.roles.length > 0) {
                    await ReactionRole.create({
                        messageId: rr.messageId,
                        emoji: rr.emoji,
                        roles: rr.roles,
                        multiple: true
                    });
                }
            }
        }
        
        addActivity('Reaction settings updated');
        
        res.json({
            success: true,
            message: 'Reaction settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating reaction settings:', error);
        res.json({
            success: false,
            message: 'Failed to update reaction settings'
        });
    }
});

app.post('/api/update-levels', async (req, res) => {
    try {
        const { minXp, maxXp, xpCooldown, levelAnnouncements, announcementChannel, levelRoles } = req.body;
        
        // Get others data
        const othersData = await Others.findOne({});
        
        // Update Others table with XP settings
        const updateData = {};
        if (minXp !== undefined) updateData.minXp = minXp;
        if (maxXp !== undefined) updateData.maxXp = maxXp;
        if (xpCooldown !== undefined) updateData.xpCooldown = xpCooldown;
        if (levelAnnouncements !== undefined) updateData.levelUpAnnouncement = levelAnnouncements;
        if (announcementChannel !== undefined) updateData.announcementChannel = announcementChannel;
        
        await Others.findOneAndUpdate({}, updateData, { upsert: true });
        
        if (levelRoles && levelRoles.length > 0) {
            await LevelRoles.deleteMany({});
            
            for (const lr of levelRoles) {
                if (lr.level && lr.roleId) {
                    await LevelRoles.create({
                        level: lr.level,
                        roleId: lr.roleId
                    });
                }
            }
        }
        
        addActivity('Level system updated');
        
        res.json({
            success: true,
            message: 'Level settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating level settings:', error);
        res.json({
            success: false,
            message: 'Failed to update level settings'
        });
    }
});

app.post('/api/send-message', uploadFiles, async (req, res) => {
    try {
        const { channelId, message, botId } = req.body;
        const client = botId === 'bot2' ? global.discordClient2 : global.discordClient1;
        const files = req.files || [];
        
        if (!client || !channelId) {
            return res.json({
                success: false,
                message: 'Missing required fields or bot not connected'
            });
        }
        
        if (!message && files.length === 0) {
            return res.json({
                success: false,
                message: 'Either message content or files are required'
            });
        }
        
        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            return res.json({
                success: false,
                message: 'Channel not found'
            });
        }
        
        // Check if channel supports sending messages
        if (!channel.send || typeof channel.send !== 'function') {
            return res.json({
                success: false,
                message: `Cannot send messages to this channel type (${channel.type}). Please select a text, voice, or announcement channel.`
            });
        }
        
        const attachments = files.map(file => ({
            attachment: file.buffer,
            name: file.originalname
        }));
        
        const messageOptions = {};
        if (message && message.trim()) {
            messageOptions.content = message;
        }
        if (attachments.length > 0) {
            messageOptions.files = attachments;
        }
        
        await channel.send(messageOptions);
        
        addActivity(`Message sent to #${channel.name}`);
        
        res.json({
            success: true,
            message: 'Message sent successfully'
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.json({
            success: false,
            message: 'Failed to send message'
        });
    }
});

app.post('/api/send-embed', async (req, res) => {
    try {
        const { channelId, title, description, color, image, thumbnail, footer, timestamp, botId } = req.body;
        const client = botId === 'bot2' ? global.discordClient2 : global.discordClient1;
        
        if (!client || !channelId) {
            return res.json({
                success: false,
                message: 'Missing required fields or bot not connected'
            });
        }
        
        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            return res.json({
                success: false,
                message: 'Channel not found'
            });
        }
        
        // Check if channel supports sending messages
        if (!channel.send || typeof channel.send !== 'function') {
            return res.json({
                success: false,
                message: `Cannot send embeds to this channel type (${channel.type}). Please select a text, voice, or announcement channel.`
            });
        }
        
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder();
        
        // Ensure at least title or description is provided
        if (!title && !description) {
            return res.json({
                success: false,
                message: 'Either title or description is required for embed'
            });
        }
        
        if (title) embed.setTitle(title);
        if (description) embed.setDescription(description);
        if (color) embed.setColor(color);
        if (image) embed.setImage(image);
        if (thumbnail) embed.setThumbnail(thumbnail);
        if (footer) embed.setFooter({ text: footer });
        if (timestamp) embed.setTimestamp();
        
        await channel.send({ embeds: [embed] });
        
        addActivity(`Embed sent to #${channel.name}`);
        
        res.json({
            success: true,
            message: 'Embed sent successfully'
        });
    } catch (error) {
        console.error('Error sending embed:', error);
        res.json({
            success: false,
            message: 'Failed to send embed'
        });
    }
});

app.post('/api/react-to-message', async (req, res) => {
    try {
        const { messageId, emojiList } = req.body;
        const client = global.discordClient;
        
        if (!client || !messageId) {
            return res.json({
                success: false,
                message: 'Missing required fields or bot not connected'
            });
        }
        
        let targetMessage = null;
        for (const guild of client.guilds.cache.values()) {
            for (const channel of guild.channels.cache.values()) {
                if (channel.isTextBased()) {
                    try {
                        targetMessage = await channel.messages.fetch(messageId);
                        if (targetMessage) break;
                    } catch (e) {
                    }
                }
            }
            if (targetMessage) break;
        }
        
        if (!targetMessage) {
            return res.json({
                success: false,
                message: 'Message not found'
            });
        }
        
        if (!emojiList || !emojiList.trim()) {
            return res.json({
                success: false,
                message: 'No emoji list provided'
            });
        }
        
        const emojis = emojiList.split(',').map(e => e.trim()).filter(e => e);
        
        for (const emoji of emojis) {
            try {
                await targetMessage.react(emoji);
                await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between reactions
            } catch (e) {
                console.log(`Failed to react with ${emoji}`);
            }
        }
        
        addActivity(`Reacted to message ${messageId} with ${emojis.length} emojis`);
        
        res.json({
            success: true,
            message: `Successfully reacted to message with ${emojis.length} emojis`
        });
    } catch (error) {
        console.error('Error reacting to message:', error);
        res.json({
            success: false,
            message: 'Failed to react to message'
        });
    }
});




// Database management API endpoints
app.get('/api/database/table/:tableName', async (req, res) => {
    try {
        const { tableName } = req.params;
        const database = require('./utils/database');
        
        // Validate table name to prevent SQL injection
        const allowedTables = ['users', 'bota', 'botb', 'others', 'birthdays', 'level_roles', 'reaction_roles'];
        if (!allowedTables.includes(tableName)) {
            return res.json({
                success: false,
                error: 'Invalid table name'
            });
        }
        
        const result = await database.query(`SELECT * FROM ${tableName} ORDER BY id DESC LIMIT 100`);
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error viewing table:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/database/view-table', async (req, res) => {
    try {
        const { tableName } = req.body;
        const database = require('./utils/database');
        
        // Validate table name to prevent SQL injection
        const allowedTables = ['users', 'bota', 'botb', 'others', 'birthdays', 'level_roles', 'reaction_roles', 'ai_questions'];
        if (!allowedTables.includes(tableName)) {
            return res.json({
                success: false,
                error: 'Invalid table name'
            });
        }
        
        const result = await database.query(`SELECT * FROM ${tableName} ORDER BY id DESC LIMIT 100`);
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error viewing table:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Export Database Data
app.get('/api/database/export', async (req, res) => {
    try {
        const database = require('./utils/database');
        const exportData = {};
        
        // List of tables to export
        const tables = ['users', 'bota', 'botb', 'others', 'birthdays', 'level_roles', 'reaction_roles', 'ai_questions'];
        
        for (const table of tables) {
            try {
                const result = await database.query(`SELECT * FROM ${table}`);
                exportData[table] = result.rows;
            } catch (error) {
                console.error(`Error exporting table ${table}:`, error);
                exportData[table] = [];
            }
        }
        
        // Add metadata
        exportData.metadata = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            source: 'Discord Bot Dashboard'
        };
        
        res.json(exportData);
    } catch (error) {
        console.error('Error exporting database:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Import Database Data
app.post('/api/database/import', async (req, res) => {
    try {
        const importData = req.body;
        const database = require('./utils/database');
        
        // Validate import data structure
        if (!importData || typeof importData !== 'object') {
            return res.json({
                success: false,
                error: 'Invalid import data format'
            });
        }
        
        const tables = ['users', 'bota', 'botb', 'others', 'birthdays', 'level_roles', 'reaction_roles', 'ai_questions'];
        let importedCount = 0;
        
        for (const table of tables) {
            if (importData[table] && Array.isArray(importData[table])) {
                try {
                    // Clear existing data
                    await database.query(`DELETE FROM ${table}`);
                    
                    // Import new data
                    for (const record of importData[table]) {
                        const columns = Object.keys(record).filter(key => key !== 'id');
                        const values = columns.map(col => record[col]);
                        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                        
                        if (columns.length > 0) {
                            await database.query(
                                `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
                                values
                            );
                            importedCount++;
                        }
                    }
                } catch (error) {
                    console.error(`Error importing table ${table}:`, error);
                }
            }
        }
        
        addActivity(`Database imported: ${importedCount} records restored`);
        
        res.json({
            success: true,
            message: `Database imported successfully. ${importedCount} records restored.`
        });
    } catch (error) {
        console.error('Error importing database:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/database/delete-user', async (req, res) => {
    try {
        const { userId } = req.body;
        const database = require('./utils/database');
        
        if (!userId) {
            return res.json({
                success: false,
                error: 'User ID is required'
            });
        }
        
        const result = await database.query('DELETE FROM users WHERE user_id = $1', [userId]);
        
        if (result.rowCount > 0) {
            res.json({
                success: true,
                message: `User with ID ${userId} deleted successfully`
            });
        } else {
            res.json({
                success: false,
                error: 'User not found'
            });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/database/delete-birthday', async (req, res) => {
    try {
        const { birthdayId } = req.body;
        const database = require('./utils/database');
        
        if (!birthdayId) {
            return res.json({
                success: false,
                error: 'Birthday ID is required'
            });
        }
        
        const result = await database.query('DELETE FROM birthdays WHERE id = $1', [birthdayId]);
        
        if (result.rowCount > 0) {
            res.json({
                success: true,
                message: `Birthday with ID ${birthdayId} deleted successfully`
            });
        } else {
            res.json({
                success: false,
                error: 'Birthday not found'
            });
        }
    } catch (error) {
        console.error('Error deleting birthday:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/database/delete-all-users', async (req, res) => {
    try {
        const database = require('./utils/database');
        const result = await database.query('DELETE FROM users');
        
        res.json({
            success: true,
            message: `Deleted ${result.rowCount} users`
        });
    } catch (error) {
        console.error('Error deleting all users:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/database/delete-all-birthdays', async (req, res) => {
    try {
        const database = require('./utils/database');
        const result = await database.query('DELETE FROM birthdays');
        
        res.json({
            success: true,
            message: `Deleted ${result.rowCount} birthdays`
        });
    } catch (error) {
        console.error('Error deleting all birthdays:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/database/update-record', async (req, res) => {
    try {
        const { table, id, data } = req.body;
        const database = require('./utils/database');
        
        // Validate table name
        const allowedTables = ['users', 'bota', 'botb', 'others', 'birthdays', 'level_roles', 'reaction_roles', 'ai_questions'];
        if (!allowedTables.includes(table)) {
            return res.json({
                success: false,
                error: 'Invalid table name'
            });
        }
        
        // Build update query
        const fields = Object.keys(data);
        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const values = [id, ...Object.values(data)];
        
        const query = `UPDATE ${table} SET ${setClause} WHERE id = $1 RETURNING *`;
        const result = await database.query(query, values);
        
        if (result.rowCount > 0) {
            res.json({
                success: true,
                message: `Record updated successfully`,
                data: result.rows[0]
            });
        } else {
            res.json({
                success: false,
                error: 'Record not found'
            });
        }
    } catch (error) {
        console.error('Error updating record:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Delete record endpoint
app.post('/api/database/delete-record', async (req, res) => {
    try {
        const { table, id } = req.body;
        const database = require('./utils/database');
        
        // Validate table name
        const allowedTables = ['users', 'bota', 'botb', 'others', 'birthdays', 'level_roles', 'reaction_roles', 'ai_questions'];
        if (!allowedTables.includes(table)) {
            return res.json({
                success: false,
                error: 'Invalid table name'
            });
        }
        
        const query = `DELETE FROM ${table} WHERE id = $1`;
        const result = await database.query(query, [id]);
        
        if (result.rowCount > 0) {
            res.json({
                success: true,
                message: `Record deleted successfully`
            });
        } else {
            res.json({
                success: false,
                error: 'Record not found'
            });
        }
    } catch (error) {
        console.error('Error deleting record:', error);
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Update welcomer settings
app.post('/api/update-welcomer-settings', async (req, res) => {
    try {
        const Others = require('./models/postgres/Others');
        const updateData = {
            welcomer_enabled: req.body.welcomer_enabled || false,
            welcomer_channel: req.body.welcomer_channel || null,
            welcomer_message: req.body.welcomer_message || 'Welcome to the server, {user}!',
            welcomer_embed_enabled: req.body.welcomer_embed_enabled || false,
            welcomer_embed_title: req.body.welcomer_embed_title || 'Welcome!',
            welcomer_embed_description: req.body.welcomer_embed_description || 'Welcome to our server, {user}! We\'re glad you\'re here.',
            welcomer_embed_color: req.body.welcomer_embed_color || '#7c3aed',
            welcomer_embed_thumbnail: req.body.welcomer_embed_thumbnail !== false,
            welcomer_embed_footer: req.body.welcomer_embed_footer || 'Have a great time!'
        };

        await Others.findOneAndUpdate({}, updateData);
        
        res.json({
            success: true,
            message: 'Welcomer settings updated successfully!'
        });
    } catch (error) {
        console.error('Error updating welcomer settings:', error);
        res.json({
            success: false,
            message: 'Error updating welcomer settings: ' + error.message
        });
    }
});

// Update auto role settings
app.post('/api/update-auto-role-settings', async (req, res) => {
    try {
        const Others = require('./models/postgres/Others');
        const updateData = {
            auto_role_enabled: req.body.auto_role_enabled || false,
            auto_role_ids: req.body.auto_role_ids || null
        };

        await Others.findOneAndUpdate({}, updateData);
        
        res.json({
            success: true,
            message: 'Auto role settings updated successfully!'
        });
    } catch (error) {
        console.error('Error updating auto role settings:', error);
        res.json({
            success: false,
            message: 'Error updating auto role settings: ' + error.message
        });
    }
});

// Enhanced database management - clear all database
app.post('/api/database/clear-all', async (req, res) => {
    try {
        const { db } = require('./server/storage');
        const { users, birthdays, aiQuestions, levelRoles, reactionRoles } = require('./shared/schema');

        // Clear all tables using Drizzle ORM
        await db.delete(users);
        await db.delete(birthdays);
        await db.delete(aiQuestions);
        await db.delete(levelRoles);
        await db.delete(reactionRoles);

        res.json({
            success: true,
            message: 'All database tables cleared successfully!'
        });
    } catch (error) {
        console.error('Error clearing database:', error);
        res.json({
            success: false,
            message: 'Error clearing database: ' + error.message
        });
    }
});

// Add Record endpoint
app.post('/api/add-record/:tableName', async (req, res) => {
    try {
        const { tableName } = req.params;
        const data = req.body;
        
        switch (tableName) {
            case 'users':
                await UserData.create({
                    userId: data.userId,
                    username: data.username,
                    xp: data.xp || 0,
                    level: data.level || 0
                });
                addActivity(`Added new user: ${data.username}`);
                break;
                
            case 'birthdays':
                await Birthday.create({
                    userId: data.userId,
                    username: data.username,
                    day: data.day,
                    month: data.month
                });
                addActivity(`Added birthday for: ${data.username}`);
                break;
                
            case 'level_roles':
                await LevelRoles.create({
                    level: data.level,
                    roleId: data.roleId
                });
                addActivity(`Added level role: Level ${data.level}`);
                break;
                
            default:
                return res.json({
                    success: false,
                    message: 'Table not supported for adding records'
                });
        }
        
        res.json({
            success: true,
            message: 'Record added successfully'
        });
    } catch (error) {
        console.error('Error adding record:', error);
        res.json({
            success: false,
            message: 'Failed to add record: ' + error.message
        });
    }
});

// Bulk Delete endpoint
app.delete('/api/bulk-delete/:tableName', async (req, res) => {
    try {
        const { tableName } = req.params;
        
        switch (tableName) {
            case 'users':
                await database.query('DELETE FROM users');
                addActivity('Bulk deleted all users');
                break;
                
            case 'birthdays':
                await database.query('DELETE FROM birthdays');
                addActivity('Bulk deleted all birthdays');
                break;
                
            case 'level_roles':
                await database.query('DELETE FROM level_roles');
                addActivity('Bulk deleted all level roles');
                break;
                
            case 'bota':
                await database.query('DELETE FROM bota');
                addActivity('Bulk deleted all Bot A configs');
                break;
                
            case 'botb':
                await database.query('DELETE FROM botb');
                addActivity('Bulk deleted all Bot B configs');
                break;
                
            case 'others':
                await database.query('DELETE FROM others');
                addActivity('Bulk deleted all other configs');
                break;
                
            case 'reaction_roles':
                await database.query('DELETE FROM reaction_roles');
                addActivity('Bulk deleted all reaction roles');
                break;
                
            default:
                return res.json({
                    success: false,
                    message: 'Table not supported for bulk delete'
                });
        }
        
        res.json({
            success: true,
            message: `All records deleted from ${tableName}`
        });
    } catch (error) {
        console.error('Error bulk deleting records:', error);
        res.json({
            success: false,
            message: 'Failed to delete records: ' + error.message
        });
    }
});

// Individual Delete endpoint for table rows
app.delete('/api/delete-record/:tableName/:recordId', async (req, res) => {
    try {
        const { tableName, recordId } = req.params;
        
        switch (tableName) {
            case 'users':
                await database.query('DELETE FROM users WHERE id = $1', [recordId]);
                addActivity(`Deleted user with ID: ${recordId}`);
                break;
                
            case 'birthdays':
                await database.query('DELETE FROM birthdays WHERE id = $1', [recordId]);
                addActivity(`Deleted birthday with ID: ${recordId}`);
                break;
                
            case 'level_roles':
                await database.query('DELETE FROM level_roles WHERE id = $1', [recordId]);
                addActivity(`Deleted level role with ID: ${recordId}`);
                break;
                
            case 'bota':
                await database.query('DELETE FROM bota WHERE id = $1', [recordId]);
                addActivity(`Deleted Bot A config with ID: ${recordId}`);
                break;
                
            case 'botb':
                await database.query('DELETE FROM botb WHERE id = $1', [recordId]);
                addActivity(`Deleted Bot B config with ID: ${recordId}`);
                break;
                
            case 'others':
                await database.query('DELETE FROM others WHERE id = $1', [recordId]);
                addActivity(`Deleted other config with ID: ${recordId}`);
                break;
                
            case 'reaction_roles':
                await database.query('DELETE FROM reaction_roles WHERE id = $1', [recordId]);
                addActivity(`Deleted reaction role with ID: ${recordId}`);
                break;
                
            default:
                return res.json({
                    success: false,
                    message: 'Table not supported for individual delete'
                });
        }
        
        res.json({
            success: true,
            message: `Record deleted from ${tableName}`
        });
    } catch (error) {
        console.error('Error deleting record:', error);
        res.json({
            success: false,
            message: 'Failed to delete record: ' + error.message
        });
    }
});

// Advanced Reaction Roles API Endpoints
app.post('/api/reaction-roles/create-set', async (req, res) => {
    try {
        const { setName, messageId, setMode, pairs, serverId } = req.body;
        
        if (!setName || !messageId || !pairs || pairs.length === 0) {
            return res.json({
                success: false,
                message: 'Set name, message ID and emoji/role pairs are required'
            });
        }

        const ReactionRole = require('./models/postgres/ReactionRole');

        // Check for duplicate message ID
        const messageExists = await ReactionRole.messageIdExists(messageId);
        if (messageExists) {
            return res.json({
                success: false,
                message: 'A reaction role set already exists for this message ID'
            });
        }

        // Check for duplicate set name
        const setNameExists = await ReactionRole.setNameExists(setName);
        if (setNameExists) {
            return res.json({
                success: false,
                message: 'A reaction role set with this name already exists'
            });
        }

        // Validate emoji formats
        const invalidEmojis = [];
        for (const pair of pairs) {
            if (!ReactionRole.validateEmojiFormat(pair.emoji)) {
                invalidEmojis.push(pair.emoji);
            }
        }
        
        if (invalidEmojis.length > 0) {
            return res.json({
                success: false,
                message: `Invalid emoji format(s): ${invalidEmojis.join(', ')}. Use Unicode emojis (⚡, 🎯) or Discord custom emojis (<:name:id>)`
            });
        }

        // Check for roles that are already used in ANY sets (prevent duplicate roles)
        const usedRoles = [];
        for (const pair of pairs) {
            const isUsed = await ReactionRole.isRoleUsedInAnySets(pair.roleId);
            if (isUsed) {
                usedRoles.push(pair.roleName);
            }
        }

        if (usedRoles.length > 0) {
            return res.json({
                success: false,
                message: `Cannot create set: These roles are already used in other reaction role sets: ${usedRoles.join(', ')}`
            });
        }

        const setId = `set_${Date.now()}`;

        // Get channel ID from Discord message
        let channelId = null;
        try {
            // Try to find the message across all channels
            if (global.discordClient1) {
                const guilds = global.discordClient1.guilds.cache;
                for (const guild of guilds.values()) {
                    for (const channel of guild.channels.cache.values()) {
                        if (channel.isTextBased()) {
                            try {
                                const message = await channel.messages.fetch(messageId);
                                if (message) {
                                    channelId = channel.id;
                                    break;
                                }
                            } catch (e) {
                                // Message not found in this channel, continue
                            }
                        }
                    }
                    if (channelId) break;
                }
            }
        } catch (error) {
            console.error('Error finding message:', error);
        }

        if (!channelId) {
            return res.json({
                success: false,
                message: 'Could not find message with that ID'
            });
        }

        // Create reaction role entries for each emoji/role pair
        const createdPairs = [];
        for (const pair of pairs) {
            const reactionRole = await ReactionRole.create({
                messageId: messageId,
                channelId: channelId,
                emojiId: pair.emoji,
                roleId: pair.roleId,
                setId: setId,
                setName: setName,
                setMode: setMode
            });
            
            if (reactionRole) {
                createdPairs.push(reactionRole);
            }
        }

        if (createdPairs.length === 0) {
            return res.json({
                success: false,
                message: 'Failed to create reaction role set'
            });
        }

        // Add reactions to the Discord message using main bot clients
        try {
            let client = null;
            // Use main discord clients that have full permissions
            if (global.discordClient && global.discordClient.channels) {
                client = global.discordClient;
            } else if (global.discordClient1 && global.discordClient1.channels) {
                client = global.discordClient1;
            }
            
            if (client) {
                const channel = client.channels.cache.get(channelId);
                if (channel) {
                    const message = await channel.messages.fetch(messageId);
                    if (message) {
                        console.log(`Adding reactions to message ${messageId} in channel ${channelId}`);
                        for (const pair of pairs) {
                            try {
                                await message.react(pair.emoji);
                                console.log(`Added reaction: ${pair.emoji}`);
                                await new Promise(resolve => setTimeout(resolve, 500)); // Delay between reactions
                            } catch (error) {
                                console.error(`Failed to add reaction ${pair.emoji}:`, error);
                            }
                        }
                    } else {
                        console.error('Message not found when trying to add reactions');
                    }
                } else {
                    console.error('Channel not found when trying to add reactions');
                }
            } else {
                console.error('No Discord client available for adding reactions');
            }
        } catch (error) {
            console.error('Error adding reactions to message:', error);
        }

        addActivity(`Created reaction role set "${setId}" with ${createdPairs.length} emoji/role pairs`);
        
        // Trigger reaction role reinitialization to ensure all sets work properly
        try {
            if (global.discordClient1 && typeof global.discordClient1.emit === 'function') {
                global.discordClient1.emit('reactionRoleSetCreated', { setId, messageId, channelId });
                console.log(`Triggered reaction role reinitialization for set ${setId}`);
            }
        } catch (error) {
            console.error('Error triggering reaction role reinitialization:', error);
        }
        
        res.json({
            success: true,
            message: `Successfully created reaction role set with ${createdPairs.length} pairs`,
            setId: setId
        });
    } catch (error) {
        console.error('Error creating reaction role set:', error);
        res.json({
            success: false,
            message: 'Failed to create reaction role set: ' + error.message
        });
    }
});

app.get('/api/reaction-roles/get-sets', async (req, res) => {
    try {
        const ReactionRole = require('./models/postgres/ReactionRole');
        const sets = await ReactionRole.getSets();
        
        res.json({
            success: true,
            sets: sets || []
        });
    } catch (error) {
        console.error('Error getting reaction role sets:', error);
        res.json({
            success: false,
            message: 'Failed to get reaction role sets: ' + error.message
        });
    }
});

app.delete('/api/reaction-roles/delete-set', async (req, res) => {
    try {
        const { setId } = req.body;
        
        if (!setId) {
            return res.json({
                success: false,
                message: 'Set ID is required'
            });
        }

        const ReactionRole = require('./models/postgres/ReactionRole');
        const deletedCount = await ReactionRole.deleteSet(setId);
        
        if (deletedCount > 0) {
            addActivity(`Deleted reaction role set "${setId}" (${deletedCount} entries)`);
            res.json({
                success: true,
                message: `Successfully deleted reaction role set "${setId}"`
            });
        } else {
            res.json({
                success: false,
                message: 'Reaction role set not found'
            });
        }
    } catch (error) {
        console.error('Error deleting reaction role set:', error);
        res.json({
            success: false,
            message: 'Failed to delete reaction role set: ' + error.message
        });
    }
});

// Reapply reaction role set - add missing emojis to Discord message
app.post('/api/reaction-roles/reapply-set', async (req, res) => {
    try {
        const { setId } = req.body;
        
        if (!setId) {
            return res.json({
                success: false,
                message: 'Set ID is required'
            });
        }

        const ReactionRole = require('./models/postgres/ReactionRole');
        const setReactions = await ReactionRole.find({ setId: setId });
        
        if (setReactions.length === 0) {
            return res.json({
                success: false,
                message: 'Reaction role set not found'
            });
        }

        // Get message info from first reaction in set
        const firstReaction = setReactions[0];
        const messageId = firstReaction.message_id;
        const channelId = firstReaction.channel_id;

        // Add reactions to the Discord message using main bot clients
        try {
            let client = null;
            // Use main discord clients that have full permissions
            if (global.discordClient && global.discordClient.channels) {
                client = global.discordClient;
            } else if (global.discordClient1 && global.discordClient1.channels) {
                client = global.discordClient1;
            }
            
            if (client) {
                const channel = client.channels.cache.get(channelId);
                if (channel) {
                    const message = await channel.messages.fetch(messageId);
                    if (message) {
                        console.log(`Reapplying reactions to message ${messageId} in channel ${channelId}`);
                        let addedCount = 0;
                        
                        for (const reaction of setReactions) {
                            try {
                                // Check if reaction already exists
                                const existingReaction = message.reactions.cache.find(r => {
                                    const reactionEmoji = r.emoji.id ? `<:${r.emoji.name}:${r.emoji.id}>` : r.emoji.name;
                                    return reactionEmoji === reaction.emoji_id;
                                });
                                
                                if (!existingReaction) {
                                    await message.react(reaction.emoji_id);
                                    console.log(`Added missing reaction: ${reaction.emoji_id}`);
                                    addedCount++;
                                    await new Promise(resolve => setTimeout(resolve, 500)); // Delay between reactions
                                } else {
                                    console.log(`Reaction already exists: ${reaction.emoji_id}`);
                                }
                            } catch (error) {
                                console.error(`Failed to add reaction ${reaction.emoji_id}:`, error);
                            }
                        }
                        
                        addActivity(`Reapplied reaction role set "${setId}" - added ${addedCount} missing reactions`);
                        
                        res.json({
                            success: true,
                            message: `Successfully reapplied set "${setId}" - added ${addedCount} missing reactions`
                        });
                    } else {
                        res.json({
                            success: false,
                            message: 'Message not found when trying to reapply reactions'
                        });
                    }
                } else {
                    res.json({
                        success: false,
                        message: 'Channel not found when trying to reapply reactions'
                    });
                }
            } else {
                res.json({
                    success: false,
                    message: 'No Discord client available for adding reactions'
                });
            }
        } catch (error) {
            console.error('Error reapplying reactions to message:', error);
            res.json({
                success: false,
                message: 'Error reapplying reactions: ' + error.message
            });
        }
    } catch (error) {
        console.error('Error reapplying reaction role set:', error);
        res.json({
            success: false,
            message: 'Failed to reapply reaction role set: ' + error.message
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dashboard server running on http://0.0.0.0:${PORT}`);
    addActivity('Dashboard server initialized');
});

module.exports = app;