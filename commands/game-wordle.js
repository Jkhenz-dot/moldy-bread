const { SlashCommandBuilder } = require('discord.js');
const { Wordle } = require('discord-gamecord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('game-wordle')
    .setDescription('Play the popular 5-letter word guessing game'),

  async execute(interaction) {
    try {
      const Game = new Wordle({
        message: interaction,
        isSlashGame: true,
        embed: {
          title: 'Wordle',
          color: '#5865F2',
          description: '**You have 6 tries to guess the word!**\n🟩 Green = Correct letter in correct position\n🟨 Yellow = Correct letter in wrong position\n⬜ Gray = Letter not in word'
        },
        customWord: null,
        timeoutTime: 60000,
        winMessage: 'You won! The word was **{word}**.',
        loseMessage: 'You lost! The word was **{word}**.',
        playerOnlyMessage: 'Only {player} can use these buttons.'
      });

      await Game.startGame();
      Game.on('gameOver', result => {
        // Game completed
      });
    } catch (error) {
      console.error('Wordle game error:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Failed to start Wordle game. Please try again.', ephemeral: true });
      }
    }
  }
};