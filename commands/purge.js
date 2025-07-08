const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription(
      "🗑️ Advanced message deletion with multiple filtering options",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Delete messages from a specific user only")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("contains")
        .setDescription("Delete messages containing specific text")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("regex")
        .setDescription("Delete messages matching regex pattern")
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName("bots")
        .setDescription("Delete messages from bots only")
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName("humans")
        .setDescription("Delete messages from humans only")
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName("attachments")
        .setDescription("Delete messages with attachments only")
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName("embeds")
        .setDescription("Delete messages with embeds only")
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName("reactions")
        .setDescription("Delete messages with reactions only")
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName("links")
        .setDescription("Delete messages containing links only")
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName("pins")
        .setDescription("Include pinned messages in deletion")
        .setRequired(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("older_than")
        .setDescription("Delete messages older than X days (1-14)")
        .setMinValue(1)
        .setMaxValue(14)
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("starts_with")
        .setDescription("Delete messages starting with specific text")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("ends_with")
        .setDescription("Delete messages ending with specific text")
        .setRequired(false),
    ),

  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");
    const targetUser = interaction.options.getUser("user");
    const contains = interaction.options.getString("contains");
    const regex = interaction.options.getString("regex");
    const botsOnly = interaction.options.getBoolean("bots");
    const humansOnly = interaction.options.getBoolean("humans");
    const attachmentsOnly = interaction.options.getBoolean("attachments");
    const embedsOnly = interaction.options.getBoolean("embeds");
    const reactionsOnly = interaction.options.getBoolean("reactions");
    const linksOnly = interaction.options.getBoolean("links");
    const includePins = interaction.options.getBoolean("pins") || false;
    const olderThan = interaction.options.getInteger("older_than");
    const startsWith = interaction.options.getString("starts_with");
    const endsWith = interaction.options.getString("ends_with");

    try {
      if (botsOnly && humansOnly) {
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Invalid Filter")
              .setDescription(
                "Cannot filter for both bots and humans simultaneously.",
              )
              .setColor(0xff0000),
          ],
          flags: [64],
        });
      }

      const messages = await interaction.channel.messages.fetch({ limit: 100 });

      let filtered = messages.filter((msg) => {
        if (msg.pinned && !includePins) return false;
        if (targetUser && msg.author.id !== targetUser.id) return false;
        if (botsOnly && !msg.author.bot) return false;
        if (humansOnly && msg.author.bot) return false;
        if (attachmentsOnly && msg.attachments.size === 0) return false;
        if (embedsOnly && msg.embeds.length === 0) return false;
        if (reactionsOnly && msg.reactions.cache.size === 0) return false;

        if (linksOnly) {
          const linkRegex = /(https?:\/\/[^\s]+)/gi;
          if (!linkRegex.test(msg.content)) return false;
        }

        if (olderThan) {
          const cutoffDate = new Date(
            Date.now() - olderThan * 24 * 60 * 60 * 1000,
          );
          if (msg.createdAt > cutoffDate) return false;
        }

        if (
          contains &&
          !msg.content.toLowerCase().includes(contains.toLowerCase())
        )
          return false;
        if (
          startsWith &&
          !msg.content.toLowerCase().startsWith(startsWith.toLowerCase())
        )
          return false;
        if (
          endsWith &&
          !msg.content.toLowerCase().endsWith(endsWith.toLowerCase())
        )
          return false;

        if (regex) {
          try {
            const pattern = new RegExp(regex, "i");
            if (!pattern.test(msg.content)) return false;
          } catch (e) {
            // Invalid regex ignored
          }
        }

        return true;
      });

      const filteredArray = filtered.first(amount);

      if (!filteredArray || filteredArray.length === 0) {
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("No Messages Found")
              .setDescription("No messages matched your filters.")
              .setColor(0xff6b6b),
          ],
          flags: [64],
        });
      }

      const deletedCount = filteredArray.length;
      await interaction.channel.bulkDelete(filteredArray);

      const filters = [];
      if (targetUser) filters.push(`User: ${targetUser.username}`);
      if (botsOnly) filters.push("Bots only");
      if (humansOnly) filters.push("Humans only");
      if (attachmentsOnly) filters.push("With attachments");
      if (embedsOnly) filters.push("With embeds");
      if (reactionsOnly) filters.push("With reactions");
      if (linksOnly) filters.push("With links");
      if (contains) filters.push(`Contains: "${contains}"`);
      if (startsWith) filters.push(`Starts with: "${startsWith}"`);
      if (endsWith) filters.push(`Ends with: "${endsWith}"`);
      if (regex) filters.push(`Regex: \`${regex}\``);
      if (olderThan) filters.push(`Older than ${olderThan} day(s)`);
      if (includePins) filters.push("Including pinned messages");

      const successEmbed = new EmbedBuilder()
        .setTitle("Purge Successful")
        .setDescription(
          `Deleted **${deletedCount}** message${deletedCount === 1 ? "" : "s"}.`,
        )
        .addFields({
          name: "Applied Filters",
          value: filters.length
            ? filters.join("\n")
            : "None (deleted by amount only)",
        })
        .setColor(0x00ff00);

      await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
    } catch (error) {
      console.error("Purge command error:", error);

      const errorEmbed = new EmbedBuilder()
        .setTitle("Purge Failed")
        .setDescription(
          "An error occurred while deleting messages. Ensure I have the required permissions and try again.",
        )
        .setColor(0xff0000);

      try {
        await interaction.reply({ embeds: [errorEmbed], flags: [64] });
      } catch (replyError) {
        console.error(
          "Failed to reply with error message:",
          replyError.message,
        );
      }
    }
  },
};
