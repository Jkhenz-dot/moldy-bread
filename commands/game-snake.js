const { SlashCommandBuilder } = require('discord.js');
const { Snake } = require('discord-gamecord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('game-snake')
    .setDescription('Play the classic Snake game'),

  async execute(interaction) {
    const Game = new Snake({
      message: interaction,
      isSlashGame: true,
      embed: {
        title: 'Snake Game',
        overTitle: 'Game Over',
        color: '#5865F2',
        description: 'Use the buttons to control the snake and eat the food!'
      },
      emojis: {
        board: '⬛',
        food: '🍎',
        up: '⬆️', 
        down: '⬇️',
        left: '⬅️',
        right: '➡️',
      },
      snake: { head: '🟢', body: '🟩', tail: '🟢', over: '💀' },
      foods: ['🍎', '🍇', '🍊', '🫐', '🥕', '🥝', '🌽'],
      stopButton: 'Stop',
      timeoutTime: 60000,
      playerOnlyMessage: 'Only {player} can use these buttons.'
    });

    Game.startGame();
    Game.on('gameOver', result => {
      // Game completed
    });
  }
};