const BaseModel = require('./BaseModel');
const database = require('../../utils/database');

class BotB extends BaseModel {
  constructor() {
    super('botb', {
      allowedChannels: 'allowed_channels',
      activityText: 'activity_text',
      activityType: 'activity_type'
    });
  }

  static async findOne() {
    try {
      const query = 'SELECT * FROM botb ORDER BY id DESC LIMIT 1';
      const result = await database.query(query);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding BotB:', error);
      return null;
    }
  }

  static async create(data = {}) {
    const instance = new BotB();
    const defaultData = {
      age: '10',
      name: 'Wisteria',
      likes: '',
      others: '',
      status: 'idle',
      dislikes: '',
      backstory: '',
      appearance: '',
      description: '',
      personality: '',
      activity_text: 'Nothing',
      activity_type: 'listening',
      allowed_channels: '1',
      ...data
    };
    return await instance.create(defaultData);
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    try {
      // For BotB, always update the single configuration record
      // First, try to find any existing record
      const existing = await this.findOne();
      
      if (!existing) {
        // If no record exists, create one with the update data
        return await this.create(updateData);
      }
      
      // Update the existing record using its ID
      const instance = new BotB();
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updateData).forEach(key => {
        const dbField = instance.mapField(key);
        setClause.push(`${dbField} = $${paramIndex}`);
        values.push(updateData[key]);
        paramIndex++;
      });

      setClause.push(`updated_at = NOW()`);
      
      const sqlQuery = `
        UPDATE botb 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      values.push(existing.id);
      
      const database = require('../../utils/database');
      const result = await database.query(sqlQuery, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating BotB:', error);
      return null;
    }
  }
}

module.exports = BotB;