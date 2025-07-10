const BaseModel = require("./BaseModel");
const database = require("../../utils/database");

class WelcomeMessage extends BaseModel {
  constructor() {
    super("welcome_messages", {
      enabled: "enabled",
      channelId: "channel_id",
      message: "message",
      embedEnabled: "embed_enabled",
      embedTitle: "embed_title",
      embedDescription: "embed_description",
      embedColor: "embed_color",
    });
  }

  static async findOne() {
    try {
      const query = "SELECT * FROM welcome_messages ORDER BY id DESC LIMIT 1";
      const result = await database.query(query);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding WelcomeMessage:", error);
      return null;
    }
  }

  static async create(data = {}) {
    const instance = new WelcomeMessage();
    const defaultData = {
      enabled: false,
      channel_id: '',
      message: 'Welcome {user} to the server!',
      embed_enabled: false,
      embed_title: 'Welcome!',
      embed_description: 'Welcome to the server!',
      embed_color: '#0099ff',
      ...data,
    };
    return await instance.create(defaultData);
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    const instance = new WelcomeMessage();
    return await instance.findOneAndUpdate(query, updateData, options);
  }
}

module.exports = WelcomeMessage;