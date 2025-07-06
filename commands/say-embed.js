const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say-embed')
    .setDescription('Send embed to channel (Admin only)')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to send to')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Embed title')
    )
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Embed description')
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Embed color (hex)')
    )
    .addStringOption(option =>
      option.setName('image')
        .setDescription('Image URL')
    )
    .addStringOption(option =>
      option.setName('thumbnail')
        .setDescription('Thumbnail URL')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    try {
      const channel = interaction.options.getChannel('channel');
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const color = interaction.options.getString('color');
      const image = interaction.options.getString('image');
      const thumbnail = interaction.options.getString('thumbnail');
      
      const embedToSend = new EmbedBuilder();
      if (title) embedToSend.setTitle(title);
      if (description) embedToSend.setDescription(description);
      if (color) embedToSend.setColor(parseInt(color.replace('#', ''), 16));
      if (image) embedToSend.setImage(image);
      if (thumbnail) embedToSend.setThumbnail(thumbnail);
      
      await channel.send({ embeds: [embedToSend] });
      
      const embed = new EmbedBuilder()
        .setTitle('Success')
        .setDescription('Embed sent')
        .setColor(0x00ff00);
      
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (e) {
      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('Failed to send embed')
        .setColor(0xff0000);
      
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  }
};