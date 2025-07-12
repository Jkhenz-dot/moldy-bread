const { SlashCommandBuilder } = require("discord.js");
const { FindEmoji } = require("discord-gamecord");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("game-findemoji")
    .setDescription("Find the different emoji among the grid"),

  async execute(interaction) {
    const Game = new FindEmoji({
      message: interaction,
      isSlashGame: true,
      embed: {
        title: "Find The Emoji",
        color: "#5865F2",
        description: "Find the different emoji in the grid!",
      },
      timeoutTime: 60000,
      hideEmojiTime: 750,
      buttonStyle: "PRIMARY",
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
      winMessage: "You found the different emoji! You took **{time}** seconds.",
      loseMessage: "You didn't find the emoji in time! It was **{emoji}**.",
      timeoutMessage: "You ran out of time! The emoji was **{emoji}**.",
      playerOnlyMessage: "Only {player} can use these buttons.",
    });

    Game.startGame();
    Game.on("gameOver", (result) => {});
  },
};
