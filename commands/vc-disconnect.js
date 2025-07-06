const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vc-disconnect')
    .setDescription('Disconnect from voice channel'),
  async execute(interaction) {
    try {
      const connection = getVoiceConnection(interaction.guildId);
      
      if (!connection) {
        const embed = new EmbedBuilder()
          .setTitle('Error')
          .setDescription('Not connected to any voice channel!')
          .setColor(0xff0000);
        
        return await interaction.reply({ embeds: [embed] });
      }
      
      const queue = interaction.client.musicQueue?.get(interaction.guildId);
      if (queue) {
        try {
          queue.songs = [];
          queue.currentSong = null;
          queue.isPlaying = false;
          queue.currentIndex = 0;
          queue.hasReplied = false;
          if (queue.player) {
            queue.player.stop();
          }
        } catch (e) {
          console.log('Error cleaning queue:', e.message);
        }
        interaction.client.musicQueue.delete(interaction.guildId);
      }
      
      connection.destroy();
      
      const embed = new EmbedBuilder()
        .setTitle('👋 Disconnected')
        .setDescription('Left voice channel and cleared queue')
        .setColor(0x00ff00);
      
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Disconnect error:', error);
      
      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('Failed to disconnect properly')
        .setColor(0xff0000);
      
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [embed] });
        } else {
          await interaction.reply({ embeds: [embed] });
        }
      } catch (e) {
        console.log('Failed to send error message:', e.message);
      }
    }
  }
};