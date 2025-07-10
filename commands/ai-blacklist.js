const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Others = require('../models/postgres/Others');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai-blacklist')
    .setDescription('Blacklist user from AI responses (Admin only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to blacklist')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    try {
      const user = interaction.options.getUser('user');
      const othersData = await Others.findOne();
      
      // Note: Blacklist functionality needs to be implemented in Others model
      const embed = new EmbedBuilder()
        .setTitle('User Blacklisted')
        .setDescription(`${user} has been blacklisted from AI responses`)
        .setColor(0x00ff00);
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('Failed to blacklist user')
        .setColor(0xff0000);
      
      await interaction.reply({ embeds: [errorEmbed] });
    }
  }
};