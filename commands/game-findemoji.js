const { SlashCommandBuilder } = require('discord.js');
const { FindEmoji } = require('discord-gamecord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('findemoji')
    .setDescription('Find the different emoji among the grid'),

  async execute(interaction) {
    const Game = new FindEmoji({
      message: interaction,
      isSlashGame: true,
      embed: {
        title: 'Find The Emoji',
        color: '#5865F2',
        description: 'Find the different emoji in the grid!'
      },
      timeoutTime: 60000,
      hideEmojiTime: 750,
      buttonStyle: 'PRIMARY',
      emojis: ['🍉', '🍇', '🍊', '🍋', '🥭', '🍎', '🍏', '🥝'],
      winMessage: 'You found the different emoji! You took **{time}** seconds.',
      loseMessage: 'You didn\'t find the emoji in time! It was **{emoji}**.',
      timeoutMessage: 'You ran out of time! The emoji was **{emoji}**.',
      playerOnlyMessage: 'Only {player} can use these buttons.'
    });

    Game.startGame();
    Game.on('gameOver', result => {
      console.log(result);
    });
  }
};