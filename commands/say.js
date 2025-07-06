const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Send message to channel (Admin only)')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to send to')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Message to send')
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option.setName('file1')
        .setDescription('File 1')
    )
    .addAttachmentOption(option =>
      option.setName('file2')
        .setDescription('File 2')
    )
    .addAttachmentOption(option =>
      option.setName('file3')
        .setDescription('File 3')
    )
    .addAttachmentOption(option =>
      option.setName('file4')
        .setDescription('File 4')
    )
    .addAttachmentOption(option =>
      option.setName('file5')
        .setDescription('File 5')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    try {
      const channel = interaction.options.getChannel('channel');
      const message = interaction.options.getString('message');
      const files = [];
      
      for (let i = 1; i <= 5; i++) {
        const file = interaction.options.getAttachment(`file${i}`);
        if (file) files.push(file);
      }
      
      await channel.send({ content: message, files });
      
      const embed = new EmbedBuilder()
        .setTitle('Success')
        .setDescription('Message sent')
        .setColor(0x00ff00);
      
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (e) {
      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('Failed to send message')
        .setColor(0xff0000);
      
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  }
};