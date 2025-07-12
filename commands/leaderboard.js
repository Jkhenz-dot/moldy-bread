const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const UserData = require('../models/postgres/UserData');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show XP leaderboard'),
  async execute(interaction) {
    try {
      const allUsers = await UserData.find();
      const sortedUsers = allUsers.sort((a, b) => b.xp - a.xp);
      
      if (sortedUsers.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('Leaderboard')
          .setDescription('No users found')
          .setColor(0x0099ff);
        
        return await interaction.reply({ embeds: [embed] });
      }

      const itemsPerPage = 10;
      const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
      let currentPage = 0;

      const generateEmbed = (page) => {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const pageUsers = sortedUsers.slice(start, end);
        
        const leaderboard = pageUsers.map((user, index) => 
          `${start + index + 1}. <@${user.discord_id}> - Level ${user.level} (${user.xp} XP)`
        ).join('\n');
        
        return new EmbedBuilder()
          .setTitle('XP Leaderboard')
          .setDescription(leaderboard)
          .setFooter({ text: `Page ${page + 1}/${totalPages} • ${sortedUsers.length} total users` })
          .setColor(0x0099ff)
          .setTimestamp();
      };

      const generateButtons = (page) => {
        return new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('leaderboard_prev')
              .setLabel('Previous')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === 0),
            new ButtonBuilder()
              .setCustomId('leaderboard_next')
              .setLabel('Next')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === totalPages - 1)
          );
      };

      const embed = generateEmbed(currentPage);
      const buttons = totalPages > 1 ? generateButtons(currentPage) : null;
      
      const response = await interaction.reply({ 
        embeds: [embed], 
        components: buttons ? [buttons] : []
      });

      if (totalPages > 1) {
        const collector = response.createMessageComponentCollector({ 
          time: 60000 
        });

        collector.on('collect', async (buttonInteraction) => {
          if (buttonInteraction.user.id !== interaction.user.id) {
            return await buttonInteraction.reply({ 
              content: 'You cannot use these buttons.', 
              ephemeral: true 
            });
          }

          if (buttonInteraction.customId === 'leaderboard_prev' && currentPage > 0) {
            currentPage--;
          } else if (buttonInteraction.customId === 'leaderboard_next' && currentPage < totalPages - 1) {
            currentPage++;
          }

          const newEmbed = generateEmbed(currentPage);
          const newButtons = generateButtons(currentPage);
          
          await buttonInteraction.update({ 
            embeds: [newEmbed], 
            components: [newButtons] 
          });
        });

        collector.on('end', () => {
          const disabledButtons = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('leaderboard_prev')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId('leaderboard_next')
                .setLabel('Next')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
            );
          
          interaction.editReply({ components: [disabledButtons] }).catch(() => {});
        });
      }
    } catch (e) {
      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('Failed to load leaderboard')
        .setColor(0xff0000);
      
      await interaction.reply({ embeds: [embed] });
    }
  }
};