const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency'),
  async execute(interaction, client) {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true, flags: MessageFlags.Ephemeral });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const api = Math.round(interaction.client.ws.ping);
    const status = api > 500 ? '🔴' : api > 200 ? '🟡' : '🟢';
    
    const embed = new EmbedBuilder()
      .setTitle('Ping')
      .setDescription(`${status} Latency: ${latency}ms\nAPI: ${api}ms`)
      .setColor(0x0099ff);
    
    await interaction.editReply({ embeds: [embed] });
  }
};