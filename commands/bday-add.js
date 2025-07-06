const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const Birthday = require('../models/postgres/Birthday');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bday-add')
    .setDescription('Add or update a birthday (Manage Server only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to add birthday for')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('month')
        .setDescription('Birthday month (1-12)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(12)
    )
    .addIntegerOption(option =>
      option.setName('day')
        .setDescription('Birthday day (1-31)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(31)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const month = interaction.options.getInteger('month');
    const day = interaction.options.getInteger('day');
    
    // Validate day based on month
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day > daysInMonth[month - 1]) {
      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription(`Invalid day for month ${month}. Day must be between 1 and ${daysInMonth[month - 1]}.`)
        .setColor(0xff0000);
      
      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
    const currentYear = new Date().getFullYear();
    const birthday = new Date(currentYear, month - 1, day);
    
    try {
      await Birthday.findOneAndUpdate(
        { userId: user.id, guildId: interaction.guildId },
        { 
          username: user.username,
          day: day,
          month: month,
          year: currentYear,
          guildId: interaction.guildId
        },
        { upsert: true }
      );
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Birthday Added')
        .setDescription(`Birthday for ${user} set to ${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`)
        .setColor(0x00ff00);
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('Failed to add birthday')
        .setColor(0xff0000);
      
      await interaction.reply({ embeds: [embed] });
    }
  }
};