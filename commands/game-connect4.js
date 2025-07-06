const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { Connect4 } = require('discord-gamecord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('connect4')
    .setDescription('Play Connect 4 with another user')
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

    const Game = new Connect4({
      message: interaction,
      isSlashGame: true,
      opponent: opponent,
      embed: {
        title: 'Connect4 Game',
        statusTitle: 'Status',
        color: '#5865F2',
      },
      emojis: {
        board: '⚪',
        player1: '🔴',
        player2: '🟡',
      },
      mentionUser: true,
      timeoutTime: 60000,
      buttonStyle: 'PRIMARY',
      turnMessage: '{emoji} | Its turn of player **{player}**.',
      winMessage: '{emoji} | **{player}** won the Connect4 Game.',
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