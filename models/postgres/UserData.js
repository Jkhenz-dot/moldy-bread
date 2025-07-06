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
    
    if (user && user.conversation_history !== undefined) {
      try {
        // PostgreSQL JSONB field returns objects directly, no need to parse
        if (Array.isArray(user.conversation_history)) {
          user.conversationHistory = user.conversation_history;
        } else if (typeof user.conversation_history === 'string') {
          user.conversationHistory = JSON.parse(user.conversation_history);
        } else {
          user.conversationHistory = [];
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
    
    // Don't stringify here - BaseModel handles JSONB fields properly
    
    try {
      const user = await instance.findOneAndUpdate(query, updateData, options);
      console.log(`Debug - UserData findOneAndUpdate result:`, user ? 'Success' : 'Failed');
      
      if (user && user.conversation_history) {
        try {
          if (Array.isArray(user.conversation_history)) {
            user.conversationHistory = user.conversation_history;
          } else if (typeof user.conversation_history === 'string') {
            user.conversationHistory = JSON.parse(user.conversation_history);
          } else {
            user.conversationHistory = [];
          }
        } catch (e) {
          user.conversationHistory = [];
        }
      }
      
      return user;
    } catch (error) {
      console.error(`Debug - UserData findOneAndUpdate error:`, error);
      return null;
    }
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