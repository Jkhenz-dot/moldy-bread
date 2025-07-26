const BaseModel = require('./BaseModel');

class Reminder extends BaseModel {
  constructor() {
    super('reminders', {
      user_id: 'user_id',
      channel_id: 'channel_id', 
      message: 'message',
      remind_at: 'remind_at'
    });
  }
  
  static async createTable() {
    const database = require('../../utils/database');
    const query = `
      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(25) NOT NULL,
        channel_id VARCHAR(25) NOT NULL,
        message TEXT NOT NULL,
        remind_at TIMESTAMP NOT NULL
      )
    `;
    
    try {
      await database.query(query);
      console.log('Table reminders created or verified');
    } catch (error) {
      console.error('Error creating table reminders:', error);
      throw error;
    }
  }

  static async addReminder(userId, channelId, message, remindAt) {
    const instance = new Reminder();
    return await instance.create({
      user_id: userId,
      channel_id: channelId,
      message: message,
      remind_at: remindAt
    });
  }

  static async getPendingReminders() {
    const database = require('../../utils/database');
    const query = `
      SELECT * FROM reminders 
      WHERE remind_at <= NOW()
      ORDER BY remind_at ASC
    `;
    const result = await database.query(query);
    return result.rows || [];
  }

  static async deleteReminder(id) {
    const instance = new Reminder();
    return await instance.deleteOne({ id });
  }

  static async getUserReminders(userId) {
    const database = require('../../utils/database');
    const query = `
      SELECT * FROM reminders 
      WHERE user_id = $1
      ORDER BY remind_at ASC
    `;
    const result = await database.query(query, [userId]);
    return result.rows || [];
  }
}

module.exports = Reminder;