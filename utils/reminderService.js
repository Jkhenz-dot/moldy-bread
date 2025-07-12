const { EmbedBuilder } = require('discord.js');

class ReminderService {
  constructor(client) {
    this.client = client;
    this.checkInterval = null;
  }

  start() {
    // Check for reminders every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkPendingReminders();
    }, 30000);
    
    console.log('Reminder service started');
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Reminder service stopped');
    }
  }

  async checkPendingReminders() {
    try {
      const Reminder = require('../models/postgres/Reminder');
      const pendingReminders = await Reminder.getPendingReminders();

      for (const reminder of pendingReminders) {
        await this.sendReminder(reminder);
        await Reminder.deleteReminder(reminder.id);
      }
    } catch (error) {
      console.error('Error checking pending reminders:', error);
    }
  }

  async sendReminder(reminder) {
    try {
      const channel = await this.client.channels.fetch(reminder.channel_id);
      if (!channel) {
        console.error(`Channel ${reminder.channel_id} not found for reminder ${reminder.id}`);
        return;
      }

      const reminderEmbed = new EmbedBuilder()
        .setTitle('Reminder')
        .setDescription(reminder.message)
        .setColor(0x6366f1)
        .setFooter({ text: 'Reminder System' })
        .setTimestamp();

      await channel.send({
        content: `<@${reminder.user_id}>`,
        embeds: [reminderEmbed]
      });


    } catch (error) {
      console.error(`Failed to send reminder ${reminder.id}:`, error);
    }
  }
}

module.exports = ReminderService;