const BaseModel = require('./BaseModel');
const database = require('../../utils/database');

class Others extends BaseModel {
  constructor() {
    super('others');
  }

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

  static async create(data = {}) {
    const instance = new Others();
    const defaultData = {
      trivia_api: process.env.TRIVIA_API || '',
      ...data
    };
    return await instance.create(defaultData);
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    const instance = new Others();
    return await instance.findOneAndUpdate(query, updateData, options);
  }
}

module.exports = Others;