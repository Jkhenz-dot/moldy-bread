const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const UserData = require('../models/postgres/UserData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai-wack')
    .setDescription('Clear your conversation memory with this bot'),
  async execute(interaction, client) {
    try {
      const userData = await UserData.findOne({ userId: interaction.user.id });
      
      if (!userData || !userData.conversationHistory) {
        const embed = new EmbedBuilder()
          .setTitle('Info')
          .setDescription('No conversation history found to clear')
          .setColor(0xffaa00);
        
        return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }
      
      // Clear all conversation history for all bots
      const originalCount = userData.conversationHistory.length;
      userData.conversationHistory = [];
      const clearedCount = originalCount;
      
      await UserData.findOneAndUpdate(
        { userId: interaction.user.id },
        { conversationHistory: userData.conversationHistory }
      );
      
      const embed = new EmbedBuilder()
        .setTitle('Success')
        .setDescription(`Cleared all your conversation memory (${clearedCount} messages)`)
        .setColor(0x00ff00);
      
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (e) {
      console.error('AI-wack error:', e);
      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('Failed to clear memory')
        .setColor(0xff0000);
      
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  }
};