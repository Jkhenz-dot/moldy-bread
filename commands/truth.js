const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
// Removed AIQuestions dependency - using simple randomization from JSON files

module.exports = {
  data: new SlashCommandBuilder()
    .setName("truth")
    .setDescription("Get a truth question with interactive options"),

  async execute(interaction) {
    try {
      // Distribution: 50% API, 50% JSON file questions
      const random = Math.random();
      let question, footerText;

      if (random < 0.5) {
        // 50% chance to use API
        try {
          const response = await fetch(
            `https://api.truthordarebot.xyz/v1/truth?rating=pg&rating=pg13`,
          );
          const data = await response.json();
          question = data.question;
          footerText = `Type: ${data.type} | Rating: ${data.rating} | ID: ${data.id}`;
        } catch (error) {
          console.log("API failed, falling back to JSON questions");
          // Fallback to JSON questions
          const fs = require('fs');
          const path = require('path');
          const jsonPath = path.join(__dirname, '..', 'data', 'truth-questions.json');
          const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          question = jsonData.questions[Math.floor(Math.random() * jsonData.questions.length)];
          footerText = `Type: TRUTH | AI Generated`;
        }
      } else {
        // 50% chance to use JSON file questions
        try {
          const fs = require('fs');
          const path = require('path');
          const jsonPath = path.join(__dirname, '..', 'data', 'truth-questions.json');
          const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          question = jsonData.questions[Math.floor(Math.random() * jsonData.questions.length)];
          footerText = `Type: TRUTH | AI Generated`;
        } catch (error) {
          console.log("JSON file failed, falling back to API");
          const response = await fetch(
            `https://api.truthordarebot.xyz/v1/truth?rating=pg&rating=pg13`,
          );
          const data = await response.json();
          question = data.question;
          footerText = `Type: ${data.type} | Rating: ${data.rating} | ID: ${data.id}`;
        }
      }

      const resultEmbed = new EmbedBuilder()
        .setAuthor({
          name: `Requested by ${interaction.user.displayName}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setDescription(question)
        .setColor(0x3498db)
        .setFooter({ text: footerText });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("td_truth")
          .setLabel("Truth")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("td_dare")
          .setLabel("Dare")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("td_random")
          .setLabel("Random")
          .setStyle(ButtonStyle.Success), // Changed to Success (green)
      );

      await interaction.reply({ embeds: [resultEmbed], components: [row] });

      const filter = (i) =>
        i.customId.startsWith("td_") && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 300000,
      });

      collector.on("collect", async (i) => {
        await i.deferUpdate();

        let newEndpoint;
        let newType;

        if (i.customId === "td_truth") {
          newEndpoint = "truth";
          newType = "Truth";
        } else if (i.customId === "td_dare") {
          newEndpoint = "dare";
          newType = "Dare";
        } else if (i.customId === "td_random") {
          const random = Math.random() < 0.5 ? "truth" : "dare";
          newEndpoint = random;
          newType = random === "truth" ? "Truth" : "Dare";
        }

        try {
          // Use 50% chance for API or JSON file
          const useAPI = Math.random() < 0.5;
          let newQuestion, newFooterText;

          if (useAPI) {
            try {
              // Use original API
              const response = await fetch(
                `https://api.truthordarebot.xyz/v1/${newEndpoint}?rating=pg&rating=pg13`,
              );
              const data = await response.json();
              newQuestion = data.question;
              newFooterText = `Type: ${data.type} | Rating: ${data.rating} | ID: ${data.id}`;
            } catch (error) {
              console.log("API failed, falling back to JSON questions");
              // Fallback to JSON questions
              const fs = require('fs');
              const path = require('path');
              const jsonPath = path.join(__dirname, '..', 'data', `${newEndpoint}-questions.json`);
              const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
              newQuestion = jsonData.questions[Math.floor(Math.random() * jsonData.questions.length)];
              newFooterText = `Type: ${newType.toUpperCase()} | AI Generated`;
            }
          } else {
            try {
              // Use JSON file questions
              const fs = require('fs');
              const path = require('path');
              const jsonPath = path.join(__dirname, '..', 'data', `${newEndpoint}-questions.json`);
              const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
              newQuestion = jsonData.questions[Math.floor(Math.random() * jsonData.questions.length)];
              newFooterText = `Type: ${newType.toUpperCase()} | AI Generated`;
            } catch (error) {
              console.log("JSON file failed, falling back to API");
              // Fallback to API
              const response = await fetch(
                `https://api.truthordarebot.xyz/v1/${newEndpoint}?rating=pg&rating=pg13`,
              );
              const data = await response.json();
              newQuestion = data.question;
              newFooterText = `Type: ${data.type} | Rating: ${data.rating} | ID: ${data.id}`;
            }
          }

          const newResultEmbed = new EmbedBuilder()
            .setAuthor({
              name: `Requested by ${interaction.user.displayName}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(newQuestion)
            .setColor(newType === "Truth" ? 0x3498db : 0xe74c3c)
            .setFooter({ text: newFooterText });

          const newRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("td_truth")
              .setLabel("Truth")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId("td_dare")
              .setLabel("Dare")
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId("td_random")
              .setLabel("Random")
              .setStyle(ButtonStyle.Success), // Changed to Success (green)
          );

          await i.followUp({ embeds: [newResultEmbed], components: [newRow] });
        } catch (error) {
          console.error("Truth/Dare error:", error);
          const errorEmbed = new EmbedBuilder()
            .setTitle("❌ Error")
            .setDescription("Failed to fetch question. Please try again.")
            .setColor(0xff0000);

          await i.followUp({ embeds: [errorEmbed] });
        }
      });

      collector.on("end", async () => {
        try {
          const disabledRow = new ActionRowBuilder().addComponents(
            row.components.map((button) =>
              ButtonBuilder.from(button).setDisabled(true),
            ),
          );
          await interaction.editReply({ components: [disabledRow] });
        } catch (e) {}
      });
    } catch (error) {
      console.error("Truth command error:", error);
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription("Failed to fetch question. Please try again.")
        .setColor(0xff0000);

      await interaction.reply({ embeds: [errorEmbed] });
    }
  },
};