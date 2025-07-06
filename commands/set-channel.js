const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const BotA = require("../models/postgres/BotA");
const BotB = require("../models/postgres/BotB");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set-channel")
    .setDescription("Set allowed channel for bot responses (Admin only)")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to allow")
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    try {
      const channel = interaction.options.getChannel("channel");
      const botAData = await BotA.findOne();
      const botBData = await BotB.findOne();

      // Update allowed channels for both bots
      if (botAData) {
        const allowedChannels = (botAData.allowed_channels || '').split(',').filter(c => c.trim());
        if (!allowedChannels.includes(channel.id)) {
          allowedChannels.push(channel.id);
          await BotA.findOneAndUpdate({}, {
            allowed_channels: allowedChannels.join(','),
          });
        }
      }

      if (botBData) {
        const allowedChannels = (botBData.allowed_channels || '').split(',').filter(c => c.trim());
        if (!allowedChannels.includes(channel.id)) {
          allowedChannels.push(channel.id);
          await BotB.findOneAndUpdate({}, {
            allowed_channels: allowedChannels.join(','),
          });
        }
      }

      const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription(`Channel ${channel} added to allowed channels`)
        .setColor(0x00ff00);

      await interaction.reply({ embeds: [embed] });
    } catch (e) {
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription("Failed to set channel")
        .setColor(0xff0000);

      await interaction.reply({ embeds: [embed] });
    }
  },
};
