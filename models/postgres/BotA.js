const BaseModel = require('./BaseModel');
const database = require('../../utils/database');

class BotA extends BaseModel {
  constructor() {
    super('bota', {
      allowedChannels: 'allowed_channels',
      activityText: 'activity_text',
      activityType: 'activity_type'
    });
  }

  static async findOne() {
    try {
      const query = 'SELECT * FROM bota ORDER BY id DESC LIMIT 1';
      const result = await database.query(query);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding BotA:', error);
      return null;
    }
  }

  static async create(data = {}) {
    const instance = new BotA();
    const defaultData = {
      age: '10',
      name: 'Heilos',
      likes: '',
      others: '',
      status: 'dnd',
      dislikes: '',
      backstory: '',
      appearance: '',
      description: '',
      personality: '',
      activity_text: 'Nothing',
      activity_type: 'streaming',
      allowed_channels: '1',
      ...data
    };
    return await instance.create(defaultData);
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    const instance = new BotA();
    return await instance.findOneAndUpdate(query, updateData, options);
  }
}

module.exports = BotA;