const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { RPS } = require('discord-gamecord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Play Rock Paper Scissors with another user')
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

    const Game = new RPS({
      message: interaction,
      isSlashGame: true,
      opponent: opponent,
      embed: {
        title: 'Rock Paper Scissors',
        color: '#5865F2',
        description: 'Choose your move!'
      },
      buttons: {
        rock: 'Rock',
        paper: 'Paper',
        scissors: 'Scissors'
      },
      emojis: {
        rock: '🗿',
        paper: '📄',
        scissors: '✂️'
      },
      mentionUser: true,
      timeoutTime: 60000,
      buttonStyle: 'PRIMARY',
      pickMessage: 'You chose {emoji}.',
      winMessage: '**{player}** won the game! Congratulations!',
      tieMessage: 'The game ended in a tie!',
      timeoutMessage: 'The game went unfinished! No one won.',
      playerOnlyMessage: 'Only {player} and {opponent} can use these buttons.'
    });

    Game.startGame();
    Game.on('gameOver', result => {
      // Game completed
    });
  }
};