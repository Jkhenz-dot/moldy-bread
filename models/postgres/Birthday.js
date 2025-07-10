const BaseModel = require('./BaseModel');

class Birthday extends BaseModel {
  constructor() {
    super('birthdays', {
      userId: 'discord_id'
    });
  }

  static async findOne(query) {
    const instance = new Birthday();
    return await instance.findOne(query);
  }

  static async create(data) {
    const instance = new Birthday();
    return await instance.create(data);
  }

  static async find(query = {}) {
    const instance = new Birthday();
    return await instance.find(query, 'month, day');
  }

  static async deleteOne(query) {
    const instance = new Birthday();
    return await instance.deleteOne(query);
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    const instance = new Birthday();
    return await instance.findOneAndUpdate(query, updateData, options);
  }
}

module.exports = Birthday;