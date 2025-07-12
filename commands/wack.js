const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const UserData = require('../models/postgres/UserData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wack')
    .setDescription('Clear your conversation memory with this bot'),
  async execute(interaction, client) {
    try {
      const userData = await UserData.findOne({ discord_id: interaction.user.id });
      
      if (!userData || !userData.conversation_history) {
        const embed = new EmbedBuilder()
          .setTitle('Info')
          .setDescription('No conversation history found to clear')
          .setColor(0xffaa00);
        
        return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }
      
      // Determine which bot is executing this command and clear only that bot's memory
      const currentBotId = client.botId;
      let conversationHistory = userData.conversation_history || [];
      
      // Parse conversation history if it's a string
      if (typeof conversationHistory === 'string') {
        try {
          conversationHistory = JSON.parse(conversationHistory);
        } catch (e) {
          conversationHistory = [];
        }
      }
      
      const originalCount = conversationHistory.length;
      
      // Filter out messages from this specific bot only
      conversationHistory = conversationHistory.filter(msg => msg.botId !== currentBotId);
      const clearedCount = originalCount - conversationHistory.length;
      
      await UserData.findOneAndUpdate(
        { discord_id: interaction.user.id },
        { conversation_history: JSON.stringify(conversationHistory) }
      );
      
      // Get bot name from database
      const { BotA, BotB } = require('../models/postgres');
      let botName = 'AI Assistant';
      
      try {
        if (currentBotId === 'bot1') {
          const botConfig = await BotA.findOne();
          botName = botConfig?.name || 'AI Assistant';
        } else if (currentBotId === 'bot2') {
          const botConfig = await BotB.findOne();
          botName = botConfig?.name || 'AI Assistant';
        }
      } catch (error) {
        console.error('Error fetching bot name:', error);
      }
      
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