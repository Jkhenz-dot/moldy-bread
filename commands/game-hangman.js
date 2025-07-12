const { SlashCommandBuilder } = require("discord.js");
const { Hangman } = require("discord-gamecord");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hangman")
    .setDescription("Play a word guessing hangman game"),

  async execute(interaction) {
    const Game = new Hangman({
      message: interaction,
      isSlashGame: true,
      embed: {
        title: "Hangman",
        color: "#5865F2",
        description: "You have 6 wrong guesses until the game ends.",
      },
      hangman: {
        hat: "🎩",
        head: "😟",
        shirt: "👔",
        pants: "🩳",
        boots: "👞👞",
      },
      customWord: null,
      timeoutTime: 60000,
      theme: "nature",
      winMessage: "You won! The word was **{word}**.",
      loseMessage: "You lost! The word was **{word}**.",
      playerOnlyMessage: "Only {player} can use these buttons.",
    });

    Game.startGame();
    Game.on("gameOver", (result) => {
      // Game completed
    });
  },
};
