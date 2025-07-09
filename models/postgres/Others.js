const BaseModel = require('./BaseModel');
const database = require('../../utils/database');

class Others extends BaseModel {
  constructor() {
    super('others', {
      xpEnabled: 'xp_enabled',
      minXp: 'min_xp',
      maxXp: 'max_xp',
      xpCooldown: 'xp_cooldown',

      forumChannels: 'forum_channels',
      forumEmojis: 'forum_emojis',
      autoRoleEnabled: 'auto_role_enabled',
      autoRoleIds: 'auto_role_ids',
      xpPerMessage: 'xp_per_message',
      levelUpChannel: 'level_up_channel',
      forumAutoReactEnabled: 'forum_auto_react_enabled',
      countingEnabled: 'counting_enabled',
      countingChannel: 'counting_channel',
      currentCount: 'current_count',
      totalMessages: 'total_messages',
      totalCommands: 'total_commands',
      totalUsers: 'total_users',
      announcementChannel: 'announcement_channel',
      levelUpAnnouncement: 'level_up_announcement',
      welcomerEnabled: 'welcomer_enabled',
      welcomerChannel: 'welcomer_channel',
      welcomerMessage: 'welcomer_message',
      welcomerEmbedEnabled: 'welcomer_embed_enabled',
      welcomerEmbedTitle: 'welcomer_embed_title',
      welcomerEmbedDescription: 'welcomer_embed_description',
      welcomerEmbedColor: 'welcomer_embed_color',
      welcomerEmbedThumbnail: 'welcomer_embed_thumbnail',
      welcomerEmbedFooter: 'welcomer_embed_footer',
      countingLastUser: 'counting_last_user',
      triviaApi: 'trivia_api'
    });
  }

  static async findOne() {
    try {
      const query = 'SELECT * FROM others ORDER BY id DESC LIMIT 1';
      const result = await database.query(query);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding Others:', error);
      return null;
    }
  }

  static async create(data = {}) {
    const instance = new Others();
    const defaultData = {
      xp_enabled: true,
      min_xp: 2,
      max_xp: 8,
      xp_cooldown: 6,

      forum_channels: '[]',
      forum_emojis: '[]',
      auto_role_enabled: false,
      auto_role_ids: '[]',
      trivia_api: process.env.TRIVIA_API || '',
      xp_per_message: 5,
      forum_auto_react_enabled: false,
      counting_enabled: false,
      current_count: 0,
      total_messages: 0,
      total_commands: 0,
      total_users: 0,
      level_up_announcement: true,
      welcomer_enabled: false,
      welcomer_embed_enabled: false,
      ...data
    };
    return await instance.create(defaultData);
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    const instance = new Others();
    return await instance.findOneAndUpdate(query, updateData, options);
  }
}

module.exports = Others;