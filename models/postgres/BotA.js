const database = require('../../utils/database');

class BotA {
  static async findOne() {
    try {
      const query = 'SELECT * FROM bota ORDER BY id DESC LIMIT 1';
      const result = await database.query(query);
      // Keep allowed_channels as text, no JSON parsing needed
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding BotA:', error);
      return null;
    }
  }

  static async create(BotA) {
    try {
      const query = `
        INSERT INTO bota (age, name, likes, others, status, dislikes, backstory, appearance, description, personality, activity_text, activity_type, allowed_channels)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      const values = [
        BotA.age || '10',
        BotA.name || 'Heilos',
        BotA.likes || '',
        BotA.others || '',
        BotA.status || 'dnd',
        BotA.dislikes || '',
        BotA.backstory || '',
        BotA.appearance || '',
        BotA.description || '',
        BotA.personality || 'helpful',
        BotA.activityText || 'NothingForNow',
        BotA.activityType || 'playing',
        BotA.allowedChannels || ''
      ];
      const result = await database.query(query, values);
      // Keep allowed_channels as text, no JSON parsing needed
      return result.rows[0];
    } catch (error) {
      console.error('Error creating BotA:', error);
      return null;
    }
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    try {
      const existingBot = await this.findOne();
      
      if (!existingBot && options.upsert) {
        return await this.create(updateData);
      }

      if (!existingBot) {
        return null;
      }

      const setClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updateData).forEach(key => {
        if (key === 'allowedChannels') {
          setClause.push(`allowed_channels = $${paramIndex}`);
          values.push(updateData[key] || '');
        } else if (key === 'activityText') {
          setClause.push(`activity_text = $${paramIndex}`);
          values.push(updateData[key]);
        } else if (key === 'activityType') {
          setClause.push(`activity_type = $${paramIndex}`);
          values.push(updateData[key]);
        } else {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(updateData[key]);
        }
        paramIndex++;
      });

      setClause.push(`updated_at = NOW()`);
      values.push(existingBot.id);

      const sqlQuery = `
        UPDATE bota 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await database.query(sqlQuery, values);
      // Keep allowed_channels as text, no JSON parsing needed
      return result.rows[0];
    } catch (error) {
      console.error('Error updating BotA:', error);
      return null;
    }
  }

  static async updateOne(query, updateData) {
    return await this.findOneAndUpdate(query, updateData);
  }
}

module.exports = BotA;