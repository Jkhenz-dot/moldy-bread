const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vc-join')
    .setDescription('Join your voice channel'),
  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;
    
    if (!voiceChannel) {
      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('You need to be in a voice channel!')
        .setColor(0xff0000);
      
      return await interaction.reply({ embeds: [embed] });
    }
    
    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });
      
      if (!interaction.client.musicQueue) {
        interaction.client.musicQueue = new Map();
      }
      
      if (!interaction.client.musicQueue.has(interaction.guildId)) {
        interaction.client.musicQueue.set(interaction.guildId, {
          connection,
          songs: [],
          isPlaying: false,
          currentSong: null,
          currentIndex: 0
        });
      }
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Joined Voice Channel')
        .setDescription(`Connected to ${voiceChannel.name}`)
        .setColor(0x00ff00);
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('Failed to join voice channel')
        .setColor(0xff0000);
      
      await interaction.reply({ embeds: [embed] });
    }
  }
};