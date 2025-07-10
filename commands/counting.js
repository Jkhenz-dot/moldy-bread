const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const Others = require("../models/postgres/Others");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("counting")
    .setDescription("Set up or manage the counting game")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup")
        .setDescription("Set up counting game in a channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Channel for counting game")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("disable").setDescription("Disable counting game"),
    ),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({
        content:
          "You need Administrator permission to manage the counting game!",
        flags: MessageFlags.Ephemeral,
      });
    }

    let othersData = await Others.findOne({});
    if (!othersData) {
      othersData = await Others.create({
        counting_enabled: false,
        counting_channel: null,
        counting_current: 0
      });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "setup") {
      const channel = interaction.options.getChannel("channel");

      await Others.findOneAndUpdate({}, {
        counting_enabled: true,
        counting_channel: channel.id,
        counting_current: 0
      }, { upsert: true });

      // Send initial "1" message to start the counting
      try {
        const startMessage = await channel.send("1");
        await startMessage.react("✅");
        await Others.findOneAndUpdate({}, {
          counting_current: 1
        });
      } catch (e) {
        console.log("Failed to send initial counting message:", e.message);
      }

      const embed = new EmbedBuilder()
        .setTitle("Counting Game Setup")
        .setDescription(
          `Counting game has been set up in ${channel}!\n\n**Rules:**\n• Count from 1 onwards\n• No same user twice in a row\n• Numbers only (no letters)\n• Wrong number/letter resets to 1\n\nI've started the counting with **1** - next number is **2**!`,
        )
        .setColor("#00ff00");

      await interaction.reply({ embeds: [embed] });
    } else if (subcommand === "disable") {
      await Others.findOneAndUpdate({}, {
        counting_enabled: false
      }, { upsert: true });

      const embed = new EmbedBuilder()
        .setTitle("🔢 Counting Game Disabled")
        .setDescription("Counting game has been disabled.")
        .setColor("#ff0000");

      await interaction.reply({ embeds: [embed] });
    }
  },
};