const BaseModel = require("./BaseModel");
const database = require("../../utils/database");

class Others extends BaseModel {
  constructor() {
    super("others", {
      xpEnabled: "xp_enabled",
      minXp: "min_xp",
      maxXp: "max_xp",
      xpCooldown: "xp_cooldown",
      levelUpAnnouncement: "level_up_announcement",

      announcementChannel: "announcement_channel",
      
      autoRoleEnabled: "auto_role_enabled",
      autoRoleIds: "auto_role_ids",
      
      forumAutoReactEnabled: "forum_auto_react_enabled",
      forumChannels: "forum_channels",
      forumEmojis: "forum_emojis",
      
      countingEnabled: "counting_enabled",
      countingChannel: "counting_channel",
      countingCurrent: "counting_current",
      countingLastUser: "counting_last_user",
    });
  }

  static async findOne() {
    try {
      const query = "SELECT * FROM others ORDER BY id DESC LIMIT 1";
      const result = await database.query(query);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding Others:", error);
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
      level_up_announcement: true,

      announcement_channel: '',
      
      auto_role_enabled: false,
      auto_role_ids: "[]",
      
      forum_auto_react_enabled: false,
      forum_channels: "[]",
      forum_emojis: "[]",
      
      counting_enabled: false,
      counting_channel: null,
      counting_current: 0,
      counting_last_user: null,
      ...data,
    };
    return await instance.create(defaultData);
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    const instance = new Others();
    return await instance.findOneAndUpdate(query, updateData, options);
  }
}

module.exports = Others;
