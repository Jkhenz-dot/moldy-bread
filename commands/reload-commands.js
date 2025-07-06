const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reload-commands')
    .setDescription('Reload all slash commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    try {
      const { REST, Routes, MessageFlags } = require("discord.js");
      const fs = require('fs');
      const path = require('path');
      
      // Clear the commands collection
      interaction.client.commands.clear();
      
      // Read all command files
      const commandsPath = path.join(__dirname, '.');
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
      
      const commands = [];
      
      // Reload each command
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        
        // Delete from require cache to reload fresh
        delete require.cache[require.resolve(filePath)];
        
        try {
          const command = require(filePath);
          if ('data' in command && 'execute' in command) {
            interaction.client.commands.set(command.data.name, command);
            commands.push(command.data);
          }
        } catch (error) {
          console.error(`Error loading command ${file}:`, error);
        }
      }
      
      // Re-register commands with Discord
      const rest = new REST().setToken(process.env.DISCORD_TOKEN);
      await rest.put(Routes.applicationCommands(interaction.client.user.id), {
        body: commands,
      });
      
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Commands Reloaded')
        .setDescription(`Successfully reloaded ${commands.length} commands.\nAll slash commands are now updated.`);
      
      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral // ephemeral
      });
    } catch (error) {
      console.error('Failed to reload commands:', error);
      
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Failed to Reload Commands')
        .setDescription('Something went wrong while reloading commands. Check console for details.');
      
      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral // ephemeral
      });
    }
  }
};