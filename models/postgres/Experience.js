const BaseModel = require("./BaseModel");
const database = require("../../utils/database");

class Experience extends BaseModel {
  constructor() {
    super("experience", {
      xpEnabled: "xp_enabled",
      minXp: "min_xp",
      maxXp: "max_xp",
      xpCooldown: "xp_cooldown",
      threadXp: "thread_xp",
      streamerXp: "streamer_xp",
      minuteCheck: "minute_check",
      slashXp: "slash_xp",
      mentionXp: "mention_xp"
    });
  }

  static async findOne() {
    try {
      const query = "SELECT * FROM experience ORDER BY id DESC LIMIT 1";
      const result = await database.query(query);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding Experience:", error);
      return null;
    }
  }

  static async create(data = {}) {
    const instance = new Experience();
    const defaultData = {
      xp_enabled: true,
      min_xp: 2,
      max_xp: 8,
      xp_cooldown: 6,
      thread_xp: 0,
      ...data,
    };
    return await instance.create(defaultData);
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    const instance = new Experience();
    return await instance.findOneAndUpdate(query, updateData, options);
  }
}

module.exports = Experience;
