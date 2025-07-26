const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Others = require('../models/postgres/Others');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai-blacklist')
    .setDescription('Blacklist user from AI responses (Manage Messages only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to blacklist')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    try {
      const user = interaction.options.getUser('user');
      let othersData = await Others.findOne();
      
      // Create others record if it doesn't exist
      if (!othersData) {
        othersData = await Others.create({});
      }

      // Get current blacklist
      const blacklistedUsers = JSON.parse(othersData.blacklisted_users || '[]');
      
      // Add user if not already blacklisted
      if (!blacklistedUsers.includes(user.id)) {
        blacklistedUsers.push(user.id);
        await Others.findOneAndUpdate({}, {
          blacklisted_users: JSON.stringify(blacklistedUsers)
        });
      }
      
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