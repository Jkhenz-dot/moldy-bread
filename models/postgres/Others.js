const BaseModel = require("./BaseModel");
const database = require("../../utils/database");

class Others extends BaseModel {
  constructor() {
    super("others", {
      
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
      countingLastUser: "counting_last_user"
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

   static async create(data) {
    const instance = new LevelRoles();
    return await instance.create(data);
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    const instance = new Others();
    return await instance.findOneAndUpdate(query, updateData, options);
  }
}

module.exports = Others;
