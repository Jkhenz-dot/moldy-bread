const BaseModel = require('./BaseModel');

class ReactionRole extends BaseModel {
  constructor() {
    super('reaction_roles', {
      messageId: 'message_id',
      channelId: 'channel_id',
      guildId: 'guild_id',
      emojiId: 'emoji_id',
      roleId: 'role_id'
    });
  }

  static async findOne(query) {
    const instance = new ReactionRole();
    return await instance.findOne(query);
  }

  static async find(query = {}) {
    const instance = new ReactionRole();
    return await instance.find(query);
  }

  static async create(data) {
    const instance = new ReactionRole();
    return await instance.create(data);
  }

  static async deleteOne(query) {
    const instance = new ReactionRole();
    return await instance.deleteOne(query);
  }

  static async deleteBySetId(setId) {
    const instance = new ReactionRole();
    const database = require('../../utils/database');
    try {
      const result = await database.query('DELETE FROM reaction_roles WHERE set_id = $1', [setId]);
      return result.rowCount;
    } catch (error) {
      console.error('Error deleting reaction roles by set_id:', error);
      return 0;
    }
  }

  static async getAllReactionRoles() {
    const instance = new ReactionRole();
    return await instance.find();
  }
}

module.exports = ReactionRole;