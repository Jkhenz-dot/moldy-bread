const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all commands'),
  async execute(interaction) {
    const pages = [
      {
        title: 'General Commands',
        description: '`/ping` - Check latency\n`/ai-wack` - Clear your memory\n`/help` - Show commands\n\n**AI Commands:**\n`/ai-blacklist` - Blacklist user from AI (Manage Messages)\n`/ai-whitelist` - Remove user from blacklist (Manage Messages)\n`/ai-gen-image` - Generate image with AI\n`/ai-gen-music` - Generate music with AI\n`/ai-gen-video` - Generate video with AI'
      },
      {
        title: 'Gaming Commands',
        description: '**Single Player Games:**\n`/2048` - Classic 2048 puzzle game\n`/snake` - Classic Snake game\n`/hangman` - Word guessing game\n`/wordle` - 5-letter word puzzle\n`/minesweeper` - Avoid the mines\n`/flood` - Color flooding puzzle\n`/matchpairs` - Match pairs memory game\n`/fasttype` - Typing speed test\n`/findemoji` - Find different emoji\n`/shuffle` - Unscramble words\n`/guessthepokemon` - Guess Pokemon from silhouette\n\n**Multiplayer Games:**\n`/connect4` - Connect 4 with opponent\n`/tictactoe` - Tic-Tac-Toe with opponent\n\n**Truth or Dare Games:**\n`/truth` - Truth or Dare with 3 options\n`/dare` - Truth or Dare with 3 options\n`/paranoia` - Paranoia questions\n`/wyr` - Would You Rather questions\n`/nhie` - Never Have I Ever questions\n\n**Special Games:**\n`/trivia` - Advanced trivia with categories\n`/counting` - Setup counting game channel'
      },
      {
        title: 'Music Commands',
        description: '`/vc-join` - Join voice channel\n`/vc-play` - Play YouTube music with controls\n`/vc-add` - Add song to queue with URL\n`/vc-disconnect` - Leave voice channel'
      },
      {
        title: 'Leveling & Birthday',
        description: '**Leveling:**\n`/level` - Check level\n`/leaderboard` - XP leaderboard\n\n**Birthday:**\n`/bday-add` - Add birthday (Manage Server)\n`/bday-list` - Show birthdays (Manage Server)\n`/bday-remove` - Remove birthday (Manage Server)'
      },
      {
        title: 'Moderation & Settings',
        description: '**Moderation:**\n`/purge` - Delete messages\n`/say` - Send message (Manage Messages)\n`/say-embed` - Send embed (Manage Messages)\n\n**Settings:**\n`/set-channel` - Set allowed channel (Admin)'
      }
    ];
    
    let currentPage = 0;
    
    const getEmbed = (page) => {
      return new EmbedBuilder()
        .setTitle(pages[page].title)
        .setDescription(pages[page].description)
        .setFooter({ text: `Page ${page + 1}/${pages.length}` })
        .setColor(0x0099ff);
    };
    
    const getButtons = (page) => {
      return new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('help_prev')
            .setLabel('⬅️ Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('help_next')
            .setLabel('➡️ Next')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === pages.length - 1)
        );
    };
    
    await interaction.reply({
      embeds: [getEmbed(currentPage)],
      components: [getButtons(currentPage)]
    });
    
    const filter = (i) => i.customId.startsWith('help_') && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 300000 });
    
    collector.on('collect', async (i) => {
      if (i.customId === 'help_next' && currentPage < pages.length - 1) {
        currentPage++;
      } else if (i.customId === 'help_prev' && currentPage > 0) {
        currentPage--;
      }
      
      await i.update({
        embeds: [getEmbed(currentPage)],
        components: [getButtons(currentPage)]
      });
    });
    
    collector.on('end', async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch (e) {}
    });
  }
};