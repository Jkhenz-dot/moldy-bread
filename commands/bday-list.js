const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Birthday = require('../models/postgres/Birthday');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bday-list')
    .setDescription('Show all birthdays in this server'),
  async execute(interaction) {
    try {
      const birthdays = await Birthday.find({});
      
      if (!birthdays.length) {
        const embed = new EmbedBuilder()
          .setTitle('🎂 Birthdays')
          .setDescription('No birthdays found in this server')
          .setColor(0x0099ff);
        
        return await interaction.reply({ embeds: [embed] });
      }
      
      const sortedBirthdays = birthdays.sort((a, b) => {
        const dateA = new Date(a.birth_date);
        const dateB = new Date(b.birth_date);
        // Sort by month first, then by day
        if (dateA.getMonth() !== dateB.getMonth()) return dateA.getMonth() - dateB.getMonth();
        return dateA.getDate() - dateB.getDate();
      });
      
      const itemsPerPage = 5;
      const totalPages = Math.ceil(sortedBirthdays.length / itemsPerPage);
      let currentPage = 0;
      
      const getEmbed = (page) => {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = sortedBirthdays.slice(start, end);
        
        const birthdayList = pageItems.map(bday => {
          const date = new Date(bday.birth_date);
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          return `<@${bday.discord_id}> - ${month}/${day}`;
        }).join('\n');
        
        return new EmbedBuilder()
          .setTitle('🎂 Birthdays')
          .setDescription(birthdayList)
          .setFooter({ text: `Page ${page + 1}/${totalPages} • ${sortedBirthdays.length} total birthdays` })
          .setColor(0x0099ff);
      };
      
      const getButtons = (page) => {
        return new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('bday_prev')
              .setLabel('⬅️ Previous')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === 0),
            new ButtonBuilder()
              .setCustomId('bday_next')
              .setLabel('➡️ Next')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(page === totalPages - 1)
          );
      };
      
      if (totalPages <= 1) {
        await interaction.reply({ embeds: [getEmbed(0)] });
        return;
      }
      
      await interaction.reply({
        embeds: [getEmbed(currentPage)],
        components: [getButtons(currentPage)]
      });
      
      const filter = (i) => i.customId.startsWith('bday_') && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 300000 });
      
      collector.on('collect', async (i) => {
        if (i.customId === 'bday_next' && currentPage < totalPages - 1) {
          currentPage++;
        } else if (i.customId === 'bday_prev' && currentPage > 0) {
          currentPage--;
        }
        
        await i.update({
          embeds: [getEmbed(currentPage)],
          components: [getButtons(currentPage)]
        });
      });
      
      collector.on('end', async () => {
        try {
          await interaction.editReply({ components: [] });
        } catch (e) {}
      });
      
    } catch (error) {
      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('Failed to fetch birthdays')
        .setColor(0xff0000);
      
      await interaction.reply({ embeds: [embed] });
    }
  }
};