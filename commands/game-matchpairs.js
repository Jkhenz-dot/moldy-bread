const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { MatchPairs } = require("discord-gamecord");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("game-matchpairs")
    .setDescription("Match pairs of emojis in this memory game"),

  async execute(interaction) {
    try {
      const Game = new MatchPairs({
        message: interaction,
        isSlashGame: true,
        embed: {
          title: "Match Pairs",
          color: "#5865F2",
          description:
            "**Click the buttons to reveal emojis and match the pairs!**",
        },
        timeoutTime: 60000,
        emojis: [
          "<:_bleh:1379881978459062473>",
          "<:_celebrate:1206495792777531442>",
          "<:_durian:1207266125541408818>",
          "<:_flustered:1206495807323504670>",
          "<:_glowsticks:1206494479603863582>",
          "<:_hungry:1380218069888274442>",
          "<:_peeking:1206495819767881758>",
          "<:_please:1383186209505017906>",
          "<:_popcorn:1383187813306208266>",
          "<:_pout:1380264183764877354>",
          "<:_reverse:1379881425167319120>",
          "<:_shrug:1383195504015314964>",
        ],
        winMessage:
          "You won the Game! You matched all the pairs in **{turns}** turns.",
        loseMessage: "You lost the Game! Time ran out.",
        playerOnlyMessage: "Only {player} can use these buttons.",
      });

      await Game.startGame();
      Game.on("gameOver", (result) => {
        // Clean up game instance
        Game.removeAllListeners();
      });
    } catch (error) {
      console.error("MatchPairs game error:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "Failed to start MatchPairs game. Please try again.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
