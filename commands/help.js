const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription(
      "Show all available bot commands with detailed information",
    ),
  async execute(interaction) {
    const pages = [
      {
        title: "General & AI Commands",
        description:
          "**Basic Commands:**\n`/help` - Display this comprehensive command list\n`/reminder` - Set personal reminders with custom messages\n`/wack` - Clear your conversation memory with the AI\n\n**AI Generation:**\n`/imagine` - Generate custom images using AI\n\n**AI Moderation:**\n`/ai-blacklist` - Blacklist user from AI responses (Manage Messages)\n`/ai-whitelist` - Remove user from AI blacklist (Manage Messages)",
        color: 0x6366f1,
      },
      {
        title: "Single Player Games",
        description:
          "**Puzzle Games:**\n`/game-2048` - Classic 2048 number puzzle\n`/game-snake` - Classic Snake arcade game\n`/game-minesweeper` - Strategic mine avoidance\n`/game-flood` - Color flooding puzzle\n`/game-wordle` - 5-letter word guessing game\n\n**Memory & Skill Games:**\n`/game-memory` - Memory card matching game\n`/game-matchpairs` - Find matching pairs\n`/game-fasttype` - Test your typing speed\n`/game-findemoji` - Spot the different emoji\n`/game-hangman` - Classic word guessing\n`/game-guessthepokemon` - Identify Pokemon silhouettes",
        color: 0x10b981,
      },
      {
        title: "Multiplayer & Party Games",
        description:
          "**Multiplayer Games:**\n`/game-connect4` - Connect 4 with another player\n`/game-tictactoe` - Tic-Tac-Toe battles\n`/game-rps` - Rock Paper Scissors duels\n\n**Party Games:**\n`/truth` - Truth questions for groups\n`/dare` - Dare challenges for fun\n`/paranoia` - Mysterious paranoia questions\n`/wyr` - Would You Rather choices\n`/nhie` - Never Have I Ever statements\n\n**Knowledge Games:**\n`/trivia-advanced` - Multi-category trivia challenges\n`/counting` - Setup server-wide counting game",
        color: 0xf59e0b,
      },
      {
        title: "Voice Commands",
        description:
          "**Voice Features:**\n`/vc-tts` - Text-to-speech with custom voices\n\n*Note: Voice commands require being in a voice channel*",
        color: 0x8b5cf6,
      },
      {
        title: "Leveling & Social Features",
        description:
          "**XP & Ranking System:**\n`/level` - Check your current level and XP progress\n`/leaderboard` - View server XP leaderboard rankings\n\n**Birthday Management:**\n`/bday-add` - Add birthday to server calendar (Manage Server)\n`/bday-list` - Display all upcoming birthdays (Manage Server)\n`/bday-remove` - Remove birthday from calendar (Manage Server)\n\n*XP is earned by actively chatting in the server. Level up to unlock special roles and perks!*",
        color: 0xec4899,
      },
      {
        title: "Moderation & Administration",
        description:
          "**Message Management:**\n`/purge` - Bulk delete messages (Manage Messages)\n`/say` - Send messages as the bot (Manage Messages)\n\n**Server Settings:**\n`/reload-commands` - Refresh bot commands (Bot Owner)\n\n**Development Tools:**\nUse the web dashboard for advanced configuration including:\n• AI personality settings\n• XP system customization\n• Welcome message setup\n• Reaction role management\n• Auto-moderation features",
        color: 0xef4444,
      },
    ];

    let currentPage = 0;

    const getEmbed = (page) => {
      const embed = new EmbedBuilder()
        .setTitle(pages[page].title)
        .setDescription(pages[page].description)
        .setFooter({
          text: `Page ${page + 1}/${pages.length} • :v Faces Mascots Bot`,
          iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setColor(pages[page].color || 0x6366f1)
        .setTimestamp();

      // Add thumbnail for the first page
      if (page === 0) {
        embed.setThumbnail(
          interaction.client.user.displayAvatarURL({ size: 256 }),
        );
      }

      return embed;
    };

    const getButtons = (page) => {
      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("help_prev")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("help_home")
          .setLabel("Home")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("help_next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === pages.length - 1),
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("help_games")
          .setLabel("Games")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("help_music")
          .setLabel("Music")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("help_level")
          .setLabel("Leveling")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("help_mod")
          .setLabel("Moderation")
          .setStyle(ButtonStyle.Danger),
      );

      return [row1, row2];
    };

    await interaction.reply({
      embeds: [getEmbed(currentPage)],
      components: getButtons(currentPage),
    });

    const filter = (i) =>
      i.customId.startsWith("help_") && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 600000,
    });

    collector.on("collect", async (i) => {
      let newPage = currentPage;

      switch (i.customId) {
        case "help_next":
          if (currentPage < pages.length - 1) newPage = currentPage + 1;
          break;
        case "help_prev":
          if (currentPage > 0) newPage = currentPage - 1;
          break;
        case "help_home":
          newPage = 0;
          break;
        case "help_games":
          newPage = 1; // Single Player Games page
          break;
        case "help_music":
          newPage = 3; // Voice Commands page
          break;
        case "help_level":
          newPage = 4; // Leveling & Social page
          break;
        case "help_mod":
          newPage = 5; // Moderation page
          break;
      }

      currentPage = newPage;

      await i.update({
        embeds: [getEmbed(currentPage)],
        components: getButtons(currentPage),
      });
    });

    collector.on("end", async () => {
      try {
        const disabledComponents = getButtons(currentPage).map((row) => {
          const newRow = new ActionRowBuilder();
          row.components.forEach((component) => {
            newRow.addComponents(
              ButtonBuilder.from(component).setDisabled(true),
            );
          });
          return newRow;
        });

        await interaction.editReply({ components: disabledComponents });
      } catch (e) {
        // Silently handle errors (message might be deleted)
      }
    });
  },
};
