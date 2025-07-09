const BaseModel = require('./BaseModel');

class ReactionRole extends BaseModel {
  constructor() {
    super('reaction_roles', {
      messageId: 'message_id',
      guildId: 'guild_id',
      emojiId: 'emoji_id',
      roleId: 'role_id',
      setId: 'set_id',
      setName: 'set_name',
      setMode: 'set_mode',
      emoji: 'emoji'
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

  static async messageIdExists(messageId) {
    const instance = new ReactionRole();
    try {
      const result = await instance.findOne({ message_id: messageId });
      return !!result;
    } catch (error) {
      console.error('Error checking if message ID exists:', error);
      return false;
    }
  }

  static async setNameExists(setName) {
    const instance = new ReactionRole();
    try {
      const result = await instance.findOne({ set_name: setName });
      return !!result;
    } catch (error) {
      console.error('Error checking if set name exists:', error);
      return false;
    }
  }

  static validateEmojiFormat(emoji) {
    // Check if it's a Unicode emoji or Discord custom emoji format
    const discordEmojiPattern = /^<a?:[a-zA-Z0-9_]+:[0-9]+>$/;
    
    // Simple check for common emoji patterns
    if (discordEmojiPattern.test(emoji)) {
      return true;
    }
    
    // Basic Unicode emoji check
    return emoji.length <= 10 && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(emoji);
  }

  static async isRoleUsedInAnySets(roleId) {
    const instance = new ReactionRole();
    try {
      const result = await instance.findOne({ role_id: roleId });
      return !!result;
    } catch (error) {
      console.error('Error checking if role is used:', error);
      return false;
    }
  }

  static async getSets() {
    const database = require('../../utils/database');
    try {
      const result = await database.query(`
        SELECT 
          set_id,
          set_name,
          set_mode,
          message_id,
          emoji_id,
          role_id,
          created_at
        FROM reaction_roles 
        ORDER BY created_at DESC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error getting reaction role sets:', error);
      return [];
    }
  }

  static async deleteSet(setId) {
    const database = require('../../utils/database');
    try {
      const result = await database.query('DELETE FROM reaction_roles WHERE set_id = $1', [setId]);
      return result.rowCount;
    } catch (error) {
      console.error('Error deleting reaction role set:', error);
      return 0;
    }
  }
}

module.exports = ReactionRole;