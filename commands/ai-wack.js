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
      
      // Determine which bot is executing this command
      const currentBotId = client.botId;
      const originalCount = userData.conversationHistory.length;
      
      // Filter out messages from this specific bot
      userData.conversationHistory = userData.conversationHistory.filter(msg => msg.botId !== currentBotId);
      const clearedCount = originalCount - userData.conversationHistory.length;
      
      await UserData.findOneAndUpdate(
        { userId: interaction.user.id },
        { conversationHistory: userData.conversationHistory }
      );
      
      const botName = currentBotId === 'bot1' ? 'Bot 1' : 'Bot 2';
      const embed = new EmbedBuilder()
        .setTitle('Success')
        .setDescription(`Cleared your conversation memory with ${botName} (${clearedCount} messages)`)
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