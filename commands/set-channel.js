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
      const BotA = await BotA.findOne();
      const BotB = await BotB.findOne();

      // Update allowed channels for both bots
      if (BotA) {
        const allowedChannels = BotA.allowed_channels || [];
        if (!allowedChannels.includes(channel.id)) {
          allowedChannels.push(channel.id);
          await BotA.findByIdAndUpdate(BotA._id, {
            allowed_channels: allowedChannels,
          });
        }
      }

      if (BotB) {
        const allowedChannels = BotB.allowed_channels || [];
        if (!allowedChannels.includes(channel.id)) {
          allowedChannels.push(channel.id);
          await BotB.findByIdAndUpdate(BotB._id, {
            allowed_channels: allowedChannels,
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
