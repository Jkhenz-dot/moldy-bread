const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Set a reminder for yourself')
    .addStringOption(option =>
      option.setName('time')
        .setDescription('When to remind you (e.g., 10m, 1h, 2d)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('What to remind you about')
        .setRequired(true)
        .setMaxLength(500)
    ),

  async execute(interaction) {
    const timeInput = interaction.options.getString('time').toLowerCase();
    const reminderMessage = interaction.options.getString('message');
    const targetChannel = interaction.channel;
    const userId = interaction.user.id;

    // Parse time input
    const timeRegex = /^(\d+)(m|h|d)$/;
    const match = timeInput.match(timeRegex);

    if (!match) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('Invalid Time Format')
        .setDescription('Please use a valid time format:')
        .addFields([
          { name: 'Minutes', value: '10m, 30m, 45m', inline: true },
          { name: 'Hours', value: '1h, 2h, 12h', inline: true },
          { name: 'Days', value: '1d, 3d, 7d', inline: true }
        ])
        .setColor(0xef4444)
        .setFooter({ text: 'Reminder System' });

      return interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral
      });
    }

    const amount = parseInt(match[1]);
    const unit = match[2];

    // Set limits
    let maxAmount;
    let unitName;
    switch (unit) {
      case 'm':
        maxAmount = 1440; // 24 hours in minutes
        unitName = amount === 1 ? 'minute' : 'minutes';
        break;
      case 'h':
        maxAmount = 168; // 7 days in hours
        unitName = amount === 1 ? 'hour' : 'hours';
        break;
      case 'd':
        maxAmount = 30; // 30 days
        unitName = amount === 1 ? 'day' : 'days';
        break;
    }

    if (amount > maxAmount) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('Time Limit Exceeded')
        .setDescription(`Maximum allowed time for ${unit === 'm' ? 'minutes' : unit === 'h' ? 'hours' : 'days'}: ${maxAmount}`)
        .setColor(0xef4444)
        .setFooter({ text: 'Reminder System' });

      return interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral
      });
    }

    // Convert to milliseconds
    let delay;
    switch (unit) {
      case 'm':
        delay = amount * 60 * 1000;
        break;
      case 'h':
        delay = amount * 60 * 60 * 1000;
        break;
      case 'd':
        delay = amount * 24 * 60 * 60 * 1000;
        break;
    }

    // Calculate reminder time
    const remindAt = new Date(Date.now() + delay);

    try {
      // Save reminder to database
      const Reminder = require('../models/postgres/Reminder');
      await Reminder.addReminder(userId, targetChannel.id, reminderMessage, remindAt);

      // Create confirmation embed
      const confirmEmbed = new EmbedBuilder()
        .setTitle('Reminder Set')
        .setDescription(`I'll remind you in ${amount} ${unitName}`)
        .addFields([
          { name: 'Reminder', value: reminderMessage, inline: false },
          { name: 'Time', value: `<t:${Math.floor(remindAt.getTime() / 1000)}:R>`, inline: true },
          { name: 'Exact Time', value: `<t:${Math.floor(remindAt.getTime() / 1000)}:f>`, inline: true }
        ])
        .setColor(0x10b981)
        .setFooter({ text: 'Reminder System - Saved to database' })
        .setTimestamp();

      await interaction.reply({
        embeds: [confirmEmbed],
        flags: MessageFlags.Ephemeral
      });

    } catch (error) {
      console.error('Failed to save reminder:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('Failed to save reminder to database. Please try again.')
        .setColor(0xef4444)
        .setFooter({ text: 'Reminder System' });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral
      });
    }
  }
};