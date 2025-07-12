const { SlashCommandBuilder } = require('discord.js');
const { TwoZeroFourEight } = require('discord-gamecord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('2048')
    .setDescription('Play the classic 2048 puzzle game'),

  async execute(interaction) {
    const Game = new TwoZeroFourEight({
      message: interaction,
      isSlashGame: true,
      embed: {
        title: '2048 Game',
        color: '#5865F2',
        description: '**Use the buttons to move tiles and combine them to reach 2048!**'
      },
      emojis: {
        up: '⬆️',
        down: '⬇️', 
        left: '⬅️',
        right: '➡️',
      },
      timeoutTime: 60000,
      buttonStyle: 'PRIMARY',
      playerOnlyMessage: 'Only {player} can use these buttons.'
    });

    Game.startGame();
    Game.on('gameOver', result => {
     
    });
  }
};