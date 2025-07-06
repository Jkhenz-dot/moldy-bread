const database = require('../../utils/database');

class ReactionRole {
  static async find(query = {}) {
    try {
      let sqlQuery = 'SELECT * FROM reaction_roles';
      const values = [];
      
      if (Object.keys(query).length > 0) {
        const whereClause = [];
        let paramIndex = 1;
        
        Object.keys(query).forEach(key => {
          if (key === 'messageId') {
            whereClause.push(`message_id = $${paramIndex}`);
          } else if (key === 'channelId') {
            whereClause.push(`channel_id = $${paramIndex}`);
          } else if (key === 'emojiId') {
            whereClause.push(`emoji_id = $${paramIndex}`);
          } else if (key === 'roleId') {
            whereClause.push(`role_id = $${paramIndex}`);
          } else if (key === 'setId') {
            whereClause.push(`set_id = $${paramIndex}`);
          } else if (key === 'setMode') {
            whereClause.push(`set_mode = $${paramIndex}`);
          } else {
            whereClause.push(`${key} = $${paramIndex}`);
          }
          values.push(query[key]);
          paramIndex++;
        });
        
        sqlQuery += ' WHERE ' + whereClause.join(' AND ');
      }
      
      const result = await database.query(sqlQuery, values);
      return result.rows;
    } catch (error) {
      console.error('Error finding reaction roles:', error);
      return [];
    }
  }

  static async findOne(query) {
    try {
      const whereClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(query).forEach(key => {
        if (key === 'messageId') {
          whereClause.push(`message_id = $${paramIndex}`);
        } else if (key === 'channelId') {
          whereClause.push(`channel_id = $${paramIndex}`);
        } else if (key === 'emojiId') {
          whereClause.push(`emoji_id = $${paramIndex}`);
        } else if (key === 'roleId') {
          whereClause.push(`role_id = $${paramIndex}`);
        } else {
          whereClause.push(`${key} = $${paramIndex}`);
        }
        values.push(query[key]);
        paramIndex++;
      });

      const sqlQuery = `SELECT * FROM reaction_roles WHERE ${whereClause.join(' AND ')} LIMIT 1`;
      const result = await database.query(sqlQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding reaction role:', error);
      return null;
    }
  }

  static async create(reactionRoleData) {
    try {
      const query = `
        INSERT INTO reaction_roles (message_id, channel_id, emoji_id, role_id, set_id, set_name, set_mode)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const values = [
        reactionRoleData.messageId,
        reactionRoleData.channelId,
        reactionRoleData.emojiId,
        reactionRoleData.roleId,
        reactionRoleData.setId || 'default',
        reactionRoleData.setName || 'Unnamed Set',
        reactionRoleData.setMode || 'multiple'
      ];
      const result = await database.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating reaction role:', error);
      return null;
    }
  }

  static async deleteOne(query) {
    try {
      const whereClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(query).forEach(key => {
        if (key === 'messageId') {
          whereClause.push(`message_id = $${paramIndex}`);
        } else if (key === 'channelId') {
          whereClause.push(`channel_id = $${paramIndex}`);
        } else if (key === 'emojiId') {
          whereClause.push(`emoji_id = $${paramIndex}`);
        } else if (key === 'roleId') {
          whereClause.push(`role_id = $${paramIndex}`);
        } else {
          whereClause.push(`${key} = $${paramIndex}`);
        }
        values.push(query[key]);
        paramIndex++;
      });

      const sqlQuery = `DELETE FROM reaction_roles WHERE ${whereClause.join(' AND ')} RETURNING *`;
      const result = await database.query(sqlQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting reaction role:', error);
      return null;
    }
  }

  static async deleteMany(query = {}) {
    try {
      if (Object.keys(query).length === 0) {
        // Delete all if no query provided
        const sqlQuery = 'DELETE FROM reaction_roles';
        const result = await database.query(sqlQuery);
        return { deletedCount: result.rowCount };
      }
      
      const whereClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(query).forEach(key => {
        if (key === 'messageId') {
          whereClause.push(`message_id = $${paramIndex}`);
        } else if (key === 'channelId') {
          whereClause.push(`channel_id = $${paramIndex}`);
        } else if (key === 'emojiId') {
          whereClause.push(`emoji_id = $${paramIndex}`);
        } else if (key === 'roleId') {
          whereClause.push(`role_id = $${paramIndex}`);
        } else {
          whereClause.push(`${key} = $${paramIndex}`);
        }
        values.push(query[key]);
        paramIndex++;
      });

      const sqlQuery = `DELETE FROM reaction_roles WHERE ${whereClause.join(' AND ')}`;
      const result = await database.query(sqlQuery, values);
      return { deletedCount: result.rowCount };
    } catch (error) {
      console.error('Error deleting reaction roles:', error);
      return { deletedCount: 0 };
    }
  }

  // Get all reaction role sets with their reactions
  static async getSets() {
    try {
      const sqlQuery = 'SELECT * FROM reaction_roles ORDER BY set_id, id';
      const result = await database.query(sqlQuery);
      return result.rows;
    } catch (error) {
      console.error('Error getting reaction role sets:', error);
      return [];
    }
  }

  // Get all reactions for a specific set
  static async getSetReactions(setId) {
    try {
      const sqlQuery = 'SELECT * FROM reaction_roles WHERE set_id = $1 ORDER BY id';
      const result = await database.query(sqlQuery, [setId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting set reactions:', error);
      return [];
    }
  }

  // Delete entire reaction role set
  static async deleteSet(setId) {
    try {
      const sqlQuery = 'DELETE FROM reaction_roles WHERE set_id = $1';
      const result = await database.query(sqlQuery, [setId]);
      return result.rowCount;
    } catch (error) {
      console.error('Error deleting reaction role set:', error);
      return 0;
    }
  }

  // Get all reaction roles for initialization
  static async getAllReactionRoles() {
    try {
      const sqlQuery = 'SELECT * FROM reaction_roles ORDER BY set_id, id';
      const result = await database.query(sqlQuery);
      return result.rows;
    } catch (error) {
      console.error('Error getting all reaction roles:', error);
      return [];
    }
  }

  // Check if message ID already exists
  static async messageIdExists(messageId) {
    try {
      const sqlQuery = 'SELECT COUNT(*) as count FROM reaction_roles WHERE message_id = $1';
      const result = await database.query(sqlQuery, [messageId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('Error checking message ID existence:', error);
      return false;
    }
  }

  // Check if set name already exists
  static async setNameExists(setName) {
    try {
      const sqlQuery = 'SELECT COUNT(*) as count FROM reaction_roles WHERE set_name = $1';
      const result = await database.query(sqlQuery, [setName]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('Error checking set name existence:', error);
      return false;
    }
  }

  // Get all roles used in reaction role sets (for exclusivity checking)
  static async getAllUsedRoles() {
    try {
      const sqlQuery = 'SELECT DISTINCT role_id, set_id, set_name FROM reaction_roles ORDER BY set_id';
      const result = await database.query(sqlQuery);
      return result.rows;
    } catch (error) {
      console.error('Error getting all used roles:', error);
      return [];
    }
  }

  // Check if role is used in any sets
  static async isRoleUsedInAnySets(roleId) {
    try {
      const sqlQuery = 'SELECT COUNT(*) as count FROM reaction_roles WHERE role_id = $1';
      const result = await database.query(sqlQuery, [roleId]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('Error checking if role is used:', error);
      return false;
    }
  }

  // Check if role is used in other sets
  static async getRoleConflicts(roleId, excludeSetId = null) {
    try {
      let sqlQuery = 'SELECT set_id, set_name FROM reaction_roles WHERE role_id = $1';
      const values = [roleId];
      
      if (excludeSetId) {
        sqlQuery += ' AND set_id != $2';
        values.push(excludeSetId);
      }
      
      const result = await database.query(sqlQuery, values);
      return result.rows;
    } catch (error) {
      console.error('Error checking role conflicts:', error);
      return [];
    }
  }

  // Validate emoji format
  static validateEmojiFormat(emoji) {
    // Discord custom emoji pattern <:name:id> or <a:name:id>
    const discordEmojiPattern = /^<a?:[a-zA-Z0-9_]+:[0-9]+>$/;
    
    // Common single character emojis (most reliable approach)
    const commonEmojis = ['⚡', '🎯', '❤️', '👍', '👎', '🔥', '💯', '🎉', '😀', '😂', '😍', '🤔', '👌', '✅', '❌', '⭐', '🌟', '🎮', '🎵', '🎨', '🏆', '⚽', '🎲', '🎪', '🎭', '🎬', '📱', '💻', '🖥️', '⌨️', '🖱️'];
    
    // Check if it's a Discord custom emoji
    if (discordEmojiPattern.test(emoji)) {
      return true;
    }
    
    // Check if it's in the common emojis list
    if (commonEmojis.includes(emoji)) {
      return true;
    }
    
    // Basic unicode emoji check (single character that's likely an emoji)
    if (emoji.length === 1 || emoji.length === 2) {
      return true;
    }
    
    return false;
  }
}

module.exports = ReactionRole;