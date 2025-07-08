const BaseModel = require('./BaseModel');

class LevelRoles extends BaseModel {
  constructor() {
    super('level_roles', {
      guildId: 'guild_id',
      roleId: 'role_id'
    });
  }

  static async findOne(query) {
    const instance = new LevelRoles();
    return await instance.findOne(query);
  }

  static async find(query = {}) {
    const instance = new LevelRoles();
    return await instance.find(query, 'level ASC');
  }

  static async create(data) {
    const instance = new LevelRoles();
    return await instance.create(data);
  }

  static async deleteOne(query) {
    const instance = new LevelRoles();
    return await instance.deleteOne(query);
  }

  static async deleteMany(query = {}) {
    const instance = new LevelRoles();
    return await instance.deleteMany(query);
  }
}

module.exports = LevelRoles;