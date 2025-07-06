const { SlashCommandBuilder } = require('discord.js');
const { FastType } = require('discord-gamecord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fasttype')
    .setDescription('Test your typing speed with a quick typing game'),

  async execute(interaction) {
    const Game = new FastType({
      message: interaction,
      isSlashGame: true,
      embed: {
        title: 'Fast Type',
        color: '#5865F2',
        description: 'Type the following sentence as fast as you can!'
      },
      timeoutTime: 60000,
      sentence: 'Some really cool sentence to fast type.',
      winMessage: 'You typed the sentence correctly! You took **{time}** seconds.',
      loseMessage: 'You didn\'t type the sentence in time. You took **{time}** seconds.',
      othersMessage: 'Only {player} can use this command!'
    });

    Game.startGame();
    Game.on('gameOver', result => {
      console.log(result);
    });
  }
};