const { SlashCommandBuilder } = require("discord.js");
const { FastType } = require("discord-gamecord");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("game-fasttype")
    .setDescription("Test your typing speed with a quick typing game"),

  async execute(interaction) {
    try {
      const Game = new FastType({
        message: interaction,
        isSlashGame: true,
        embed: {
          title: "Fast Type",
          color: "#5865F2",
          description: "Type the following sentence as fast as you can!",
        },
        timeoutTime: 60000,
        sentence: "Some really cool sentence to fast type.",
        winMessage:
          "You typed the sentence correctly! You took **{time}** seconds.",
        loseMessage:
          "You didn't type the sentence in time. You took **{time}** seconds.",
        othersMessage: "Only {player} can use this command!",
      });

      await Game.startGame();
      Game.on("gameOver", (result) => {
        // Game completed
      });
    } catch (error) {
      console.error('FastType game error:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Failed to start FastType game. Please try again.', ephemeral: true });
      }
    }
  },
};
