const BaseModel = require('./BaseModel');

class LevelRoles extends BaseModel {
  constructor() {
    super('level_roles', {
      level: 'level',
      roleId: 'role_id',
      top1Role: 'top1_role',
      top2Role: 'top2_role',
      top3Role: 'top3_role',
      top4Role: 'top4_role',
      top5Role: 'top5_role'
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

  static async findOneAndUpdate(query, updateData, options = {}) {
    const instance = new LevelRoles();
    return await instance.findOneAndUpdate(query, updateData, options);
  }
}

module.exports = LevelRoles;