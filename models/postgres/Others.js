const database = require('../../utils/database');

class Others {
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

  static async create(othersData) {
    try {
      const query = `
        INSERT INTO others (max_xp, min_xp, xp_cooldown, announcement_channel, level_up_announcement, forum_auto_react_enabled, forum_channels, counting_enabled, counting_channel, current_count, total_messages, total_commands, total_users)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      const values = [
        othersData.maxXp || 15,
        othersData.minXp || 1,
        othersData.xpCooldown || 70000,
        othersData.announcementChannel || '1390448595446268145',
        othersData.levelUpAnnouncement !== false,
        othersData.forumAutoReactEnabled || false,
        othersData.forumChannels || '',
        othersData.countingEnabled || false,
        othersData.countingChannel || '',
        othersData.currentCount || 0,
        othersData.totalMessages || 0,
        othersData.totalCommands || 0,
        othersData.totalUsers || 0
      ];
      const result = await database.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating Others:', error);
      return null;
    }
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    try {
      const existingOthers = await this.findOne();
      
      if (!existingOthers && options.upsert) {
        return await this.create(updateData);
      }

      if (!existingOthers) {
        return null;
      }

      const setClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updateData).forEach(key => {
        if (key === 'maxXp') {
          setClause.push(`max_xp = $${paramIndex}`);
          values.push(updateData[key]);
        } else if (key === 'minXp') {
          setClause.push(`min_xp = $${paramIndex}`);
          values.push(updateData[key]);
        } else if (key === 'xpCooldown') {
          setClause.push(`xp_cooldown = $${paramIndex}`);
          values.push(updateData[key]);
        } else if (key === 'announcementChannel') {
          setClause.push(`announcement_channel = $${paramIndex}`);
          values.push(updateData[key]);
        } else if (key === 'levelUpAnnouncement') {
          setClause.push(`level_up_announcement = $${paramIndex}`);
          values.push(updateData[key]);
        } else if (key === 'forumAutoReactEnabled') {
          setClause.push(`forum_auto_react_enabled = $${paramIndex}`);
          values.push(updateData[key]);
        } else if (key === 'forumChannels') {
          setClause.push(`forum_channels = $${paramIndex}`);
          values.push(updateData[key]);
        } else if (key === 'countingEnabled') {
          setClause.push(`counting_enabled = $${paramIndex}`);
          values.push(updateData[key]);
        } else if (key === 'countingChannel') {
          setClause.push(`counting_channel = $${paramIndex}`);
          values.push(updateData[key]);
        } else if (key === 'currentCount') {
          setClause.push(`current_count = $${paramIndex}`);
          values.push(updateData[key]);
        } else if (key === 'counting_current') {
          setClause.push(`current_count = $${paramIndex}`);
          values.push(updateData[key]);
        } else if (key === 'counting_last_user') {
          setClause.push(`counting_last_user = $${paramIndex}`);
          values.push(updateData[key]);
        } else if (key === 'totalMessages') {
          setClause.push(`total_messages = $${paramIndex}`);
          values.push(updateData[key]);
        } else if (key === 'totalCommands') {
          setClause.push(`total_commands = $${paramIndex}`);
          values.push(updateData[key]);
        } else if (key === 'totalUsers') {
          setClause.push(`total_users = $${paramIndex}`);
          values.push(updateData[key]);
        } else {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(updateData[key]);
        }
        paramIndex++;
      });

      setClause.push(`updated_at = NOW()`);
      values.push(existingOthers.id);

      const sqlQuery = `
        UPDATE others 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await database.query(sqlQuery, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating Others:', error);
      return null;
    }
  }

  static async updateOne(query, updateData) {
    return await this.findOneAndUpdate(query, updateData);
  }
}

module.exports = Others;