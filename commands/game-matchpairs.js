const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { MatchPairs } = require('discord-gamecord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('matchpairs')
    .setDescription('Match pairs of emojis in this memory game'),

  async execute(interaction) {
    const Game = new MatchPairs({
      message: interaction,
      isSlashGame: true,
      embed: {
        title: 'Match Pairs',
        color: '#5865F2',
        description: '**Click the buttons to reveal emojis and match the pairs!**'
      },
      timeoutTime: 60000,
      emojis: ['🍉', '🍇', '🍊', '🥝', '🍓', '🫐', '🍍', '🥕', '🍎'],
      winMessage: 'You won the Game! You matched all the pairs in **{turns}** turns.',
      loseMessage: 'You lost the Game! Time ran out.',
      playerOnlyMessage: 'Only {player} can use these buttons.'
    });

    try {
      Game.startGame();
      Game.on('gameOver', result => {
        // Clean up game instance
        Game.removeAllListeners();
      });
    } catch (error) {
      console.error('Game error:', error);
      await interaction.reply({ content: 'Failed to start the game. Please try again.', flags: MessageFlags.Ephemeral });
    }
  }
};