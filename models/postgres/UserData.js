const BaseModel = require('./BaseModel');

class UserData extends BaseModel {
  constructor() {
    super('users', {
      userId: 'user_id',
      lastXpGain: 'last_xp_gain',
      conversationHistory: 'conversation_history'
    });
  }

  static async findOne(query) {
    const instance = new UserData();
    const user = await instance.findOne(query);
    
    if (user && user.conversation_history) {
      try {
        if (typeof user.conversation_history === 'string') {
          user.conversationHistory = JSON.parse(user.conversation_history);
        } else {
          user.conversationHistory = user.conversation_history || [];
        }
      } catch (e) {
        console.error('Error parsing conversation history:', e);
        user.conversationHistory = [];
      }
    } else if (user) {
      user.conversationHistory = [];
    }
    
    return user;
  }

  static async create(userData) {
    const instance = new UserData();
    
    // Handle conversation history serialization
    if (userData.conversationHistory) {
      userData.conversationHistory = JSON.stringify(userData.conversationHistory);
    }
    
    const user = await instance.create(userData);
    
    if (user && user.conversation_history) {
      try {
        user.conversationHistory = JSON.parse(user.conversation_history);
      } catch (e) {
        user.conversationHistory = [];
      }
    }
    
    return user;
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    const instance = new UserData();
    
    // Handle conversation history serialization
    if (updateData.conversationHistory) {
      updateData.conversationHistory = JSON.stringify(updateData.conversationHistory);
    }
    
    const user = await instance.findOneAndUpdate(query, updateData, options);
    
    if (user && user.conversation_history) {
      try {
        user.conversationHistory = JSON.parse(user.conversation_history);
      } catch (e) {
        user.conversationHistory = [];
      }
    }
    
    return user;
  }

  static async updateOne(query, updateData) {
    return await this.findOneAndUpdate(query, updateData);
  }

  static async find(query = {}) {
    const instance = new UserData();
    return await instance.find(query);
  }

  static async aggregate(pipeline) {
    const instance = new UserData();
    return await instance.aggregate(pipeline);
  }

  static async deleteOne(query) {
    const instance = new UserData();
    return await instance.deleteOne(query);
  }

  static async countDocuments(query = {}) {
    const instance = new UserData();
    return await instance.countDocuments(query);
  }
}

module.exports = UserData;