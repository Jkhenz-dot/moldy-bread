const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Others = require('../models/postgres/Others');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai-whitelist')
    .setDescription('Remove user from AI blacklist (Manage Messages only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to remove from blacklist')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    // Check if user has Manage Messages permission
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      const embed = new EmbedBuilder()
        .setTitle('Permission Denied')
        .setDescription('You need Manage Messages permission to use this command')
        .setColor(0xff0000);
      
      return await interaction.reply({ embeds: [embed] });
    }

    try {
      const user = interaction.options.getUser('user');
      let othersData = await Others.findOne();
      
      // Create others record if it doesn't exist
      if (!othersData) {
        othersData = await Others.create({});
      }

      // Get current blacklist
      const blacklistedUsers = JSON.parse(othersData.blacklisted_users || '[]');
      
      // Remove user if blacklisted
      const index = blacklistedUsers.indexOf(user.id);
      if (index > -1) {
        blacklistedUsers.splice(index, 1);
        await Others.findOneAndUpdate({}, {
          blacklisted_users: JSON.stringify(blacklistedUsers)
        });
      }
      
      const embed = new EmbedBuilder()
        .setTitle('User Whitelisted')
        .setDescription(`${user} has been removed from blacklist`)
        .setColor(0x00ff00);
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('Failed to whitelist user')
        .setColor(0xff0000);
      
      await interaction.reply({ embeds: [errorEmbed] });
    }
  }
};