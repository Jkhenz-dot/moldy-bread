const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const play = require('play-dl');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vc-add')
    .setDescription('Add song to queue using YouTube link')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('YouTube URL')
        .setRequired(true)
    ),
  async execute(interaction) {
    const url = interaction.options.getString('url');
    
    if (play.yt_validate(url) !== 'video') {
      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('Please provide a valid YouTube URL!')
        .setColor(0xff0000);
      
      return await interaction.reply({ embeds: [embed] });
    }
    
    await interaction.deferReply();
    
    try {
      const songInfo = await play.video_info(url);
      
      if (!interaction.client.musicQueue) {
        interaction.client.musicQueue = new Map();
      }
      
      let queue = interaction.client.musicQueue.get(interaction.guildId);
      
      if (!queue) {
        const embed = new EmbedBuilder()
          .setTitle('Error')
          .setDescription('No active music session! Use /vc-join first.')
          .setColor(0xff0000);
        
        return await interaction.editReply({ embeds: [embed] });
      }
      
      const song = {
        title: songInfo.title,
        url: songInfo.url,
        duration: songInfo.durationInSec,
        thumbnail: songInfo.thumbnails[0]?.url,
        requestedBy: interaction.user
      };
      
      queue.songs.push(song);
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Song Added to Queue')
        .setDescription(`**${song.title}**`)
        .addFields({ name: 'Position in queue', value: `${queue.songs.length}`, inline: true })
        .setThumbnail(song.thumbnail)
        .setColor(0x00ff00);
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('Failed to add song to queue')
        .setColor(0xff0000);
      
      await interaction.editReply({ embeds: [embed] });
    }
  }
};