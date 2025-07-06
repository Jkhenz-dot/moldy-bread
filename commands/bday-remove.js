const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Birthday = require('../models/postgres/Birthday');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bday-remove')
    .setDescription('Remove a birthday (Manage Server only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to remove birthday for')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    
    try {
      const result = await Birthday.deleteOne({ 
        userId: user.id, 
        guildId: interaction.guildId 
      });
      
      if (!result) {
        const embed = new EmbedBuilder()
          .setTitle('Error')
          .setDescription(`No birthday found for ${user}`)
          .setColor(0xff0000);
        
        return await interaction.reply({ embeds: [embed] });
      }
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Birthday Removed')
        .setDescription(`Birthday for ${user} has been removed`)
        .setColor(0x00ff00);
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('Failed to remove birthday')
        .setColor(0xff0000);
      
      await interaction.reply({ embeds: [embed] });
    }
  }
};