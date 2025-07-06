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
    const instance = new BotB();
    return await instance.findOneAndUpdate(query, updateData, options);
  }
}

module.exports = BotB;