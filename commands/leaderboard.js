const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserData = require('../models/postgres/UserData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show XP leaderboard'),
  async execute(interaction) {
    try {
      const allUsers = await UserData.find();
      const users = allUsers.sort((a, b) => b.xp - a.xp).slice(0, 10);
      const leaderboard = users.map((user, index) => `${index + 1}. <@${user.discord_id}> - Level ${user.level} (${user.xp} XP)`).join('\n') || 'No users found';
      
      const embed = new EmbedBuilder()
        .setTitle('Leaderboard')
        .setDescription(leaderboard)
        .setColor(0x0099ff);
      
      await interaction.reply({ embeds: [embed] });
    } catch (e) {
      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('Failed to load leaderboard')
        .setColor(0xff0000);
      
      await interaction.reply({ embeds: [embed] });
    }
  }
};