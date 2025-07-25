const { SlashCommandBuilder } = require('discord.js');
const { Minesweeper } = require('discord-gamecord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('game-minesweeper')
    .setDescription('Play the classic Minesweeper game'),

  async execute(interaction) {
    try {
      const Game = new Minesweeper({
        message: interaction,
        isSlashGame: true,
        embed: {
          title: 'Minesweeper',
          color: '#5865F2',
          description: '**Click the buttons to reveal the board. Avoid the mines!**'
        },
        emojis: { flag: '🚩', mine: '💣' },
        mines: 5,
        timeoutTime: 60000,
        winMessage: 'You won the Game! You successfully avoided all the mines.',
        loseMessage: 'You lost the Game! Beware of the mines next time.',
        playerOnlyMessage: 'Only {player} can use these buttons.'
      });

      await Game.startGame();
      Game.on('gameOver', result => {
        // Game completed
      });
    } catch (error) {
      console.error('Minesweeper game error:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Failed to start Minesweeper game. Please try again.', ephemeral: true });
      }
    }
  }
};