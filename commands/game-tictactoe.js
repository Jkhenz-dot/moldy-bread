const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { TicTacToe } = require('discord-gamecord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tictactoe')
    .setDescription('Play Tic-Tac-Toe with another user')
    .addUserOption(option =>
      option.setName('opponent')
        .setDescription('The user you want to play against')
        .setRequired(true)
    ),

  async execute(interaction) {
    const opponent = interaction.options.getUser('opponent');

    if (opponent.bot) {
      return interaction.reply({ 
        content: 'You cannot play against a bot!', 
        flags: MessageFlags.Ephemeral 
      });
    }

    if (opponent.id === interaction.user.id) {
      return interaction.reply({ 
        content: 'You cannot play against yourself!', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const Game = new TicTacToe({
      message: interaction,
      isSlashGame: true,
      opponent: opponent,
      embed: {
        title: 'Tic Tac Toe',
        color: '#5865F2',
        statusTitle: 'Status',
        overTitle: 'Game Over'
      },
      emojis: {
        xButton: '❌',
        oButton: '⭕',
        blankButton: '➖'
      },
      mentionUser: true,
      timeoutTime: 60000,
      xButtonStyle: 'DANGER',
      oButtonStyle: 'PRIMARY',
      turnMessage: '{emoji} | Its turn of player **{player}**.',
      winMessage: '{emoji} | **{player}** won the TicTacToe Game.',
      tieMessage: 'The Game tied! No one won the Game!',
      timeoutMessage: 'The Game went unfinished! No one won the Game!',
      playerOnlyMessage: 'Only {player} and {opponent} can use these buttons.'
    });

    Game.startGame();
    Game.on('gameOver', result => {
      console.log(result);
    });
  }
};