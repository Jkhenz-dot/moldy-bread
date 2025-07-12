const { SlashCommandBuilder } = require('discord.js');
const { Flood } = require('discord-gamecord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('game-flood')
    .setDescription('Play the color flooding puzzle game'),

  async execute(interaction) {
    const Game = new Flood({
      message: interaction,
      isSlashGame: true,
      embed: {
        title: 'Flood',
        color: '#5865F2',
        description: '**Fill the entire board with one color in the least moves possible!**'
      },
      difficulty: 13,
      timeoutTime: 60000,
      buttonStyle: 'PRIMARY',
      emojis: ['🟥', '🟦', '🟩', '🟨', '🟪', '🟧'],
      winMessage: 'You won! You took **{turns}** turns.',
      loseMessage: 'You lost! You took **{turns}** turns.',
      playerOnlyMessage: 'Only {player} can use these buttons.'
    });

    Game.startGame();
    Game.on('gameOver', result => {
      // Game completed
    });
  }
};