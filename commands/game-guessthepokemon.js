const { SlashCommandBuilder } = require('discord.js');
const { GuessThePokemon } = require('discord-gamecord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guessthepokemon')
    .setDescription('Guess the Pokemon from the silhouette'),

  async execute(interaction) {
    const Game = new GuessThePokemon({
      message: interaction,
      isSlashGame: true,
      embed: {
        title: 'Guess The Pokemon',
        color: '#5865F2',
        description: 'Guess the Pokemon from the silhouette!'
      },
      timeoutTime: 60000,
      winMessage: 'You guessed it right! It was **{pokemon}**.',
      loseMessage: 'Better luck next time! It was **{pokemon}**.',
      errMessage: 'Unable to fetch a Pokemon. Please try again.',
      playerOnlyMessage: 'Only {player} can use this command!'
    });

    Game.startGame();
    Game.on('gameOver', result => {
      console.log(result);
    });
  }
};