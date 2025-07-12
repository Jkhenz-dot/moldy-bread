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
    .setName("nhie")
    .setDescription("Get a Never Have I Ever question"),

  async execute(interaction) {
    try {
      // Distribution: 50% API, 50% JSON file questions
      const random = Math.random();
      let question, footerText;

      if (random < 0.5) {
        // 50% chance to use API
        try {
          const response = await fetch(
            `https://api.truthordarebot.xyz/v1/nhie?rating=pg&rating=pg13`,
          );
          const data = await response.json();
          question = data.question;
          footerText = `Type: ${data.type} | Rating: ${data.rating} | ID: ${data.id}`;
        } catch (error) {
          console.log("API failed, falling back to JSON questions");
          // Fallback to JSON questions
          const fs = require('fs');
          const path = require('path');
          const jsonPath = path.join(__dirname, '..', 'data', 'nhie-questions.json');
          const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          question = jsonData.questions[Math.floor(Math.random() * jsonData.questions.length)];
          footerText = `Type: NHIE | AI Generated`;
        }
      } else {
        // 50% chance to use JSON file questions
        try {
          const fs = require('fs');
          const path = require('path');
          const jsonPath = path.join(__dirname, '..', 'data', 'nhie-questions.json');
          const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          question = jsonData.questions[Math.floor(Math.random() * jsonData.questions.length)];
          footerText = `Type: NHIE | AI Generated`;
        } catch (error) {
          console.log("JSON file failed, falling back to API");
          const response = await fetch(
            `https://api.truthordarebot.xyz/v1/nhie?rating=pg&rating=pg13`,
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
        .setColor(0xe67e22)
        .setFooter({ text: footerText });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("nhie_get")
          .setLabel("Never Have I Ever")
          .setStyle(ButtonStyle.Secondary),
      );

      await interaction.reply({ embeds: [resultEmbed], components: [row] });

      const filter = (i) =>
        i.customId === "nhie_get" && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 300000,
      });

      collector.on("collect", async (i) => {
        await i.deferUpdate();

        try {
          // Use 50% chance for API or JSON file
          const useAPI = Math.random() < 0.5;
          let newQuestion, newFooterText;

          if (useAPI) {
            try {
              // Use original API
              const response = await fetch(
                "https://api.truthordarebot.xyz/v1/nhie?rating=pg&rating=pg13",
              );
              const data = await response.json();
              newQuestion = data.question;
              newFooterText = `Type: ${data.type} | Rating: ${data.rating} | ID: ${data.id}`;
            } catch (error) {
              console.log("API failed, falling back to JSON questions");
              // Fallback to JSON questions
              const fs = require('fs');
              const path = require('path');
              const jsonPath = path.join(__dirname, '..', 'data', 'nhie-questions.json');
              const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
              newQuestion = jsonData.questions[Math.floor(Math.random() * jsonData.questions.length)];
              newFooterText = `Type: NHIE | AI Generated`;
            }
          } else {
            try {
              // Use JSON file questions
              const fs = require('fs');
              const path = require('path');
              const jsonPath = path.join(__dirname, '..', 'data', 'nhie-questions.json');
              const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
              newQuestion = jsonData.questions[Math.floor(Math.random() * jsonData.questions.length)];
              newFooterText = `Type: NHIE | AI Generated`;
            } catch (error) {
              console.log("JSON file failed, falling back to API");
              // Fallback to API
              const response = await fetch(
                "https://api.truthordarebot.xyz/v1/nhie?rating=pg&rating=pg13",
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
            .setColor(0xe67e22)
            .setFooter({ text: newFooterText });

          const newRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("nhie_get")
              .setLabel("Never Have I Ever")
              .setStyle(ButtonStyle.Secondary),
          );

          await i.followUp({ embeds: [newResultEmbed], components: [newRow] });
        } catch (error) {
          console.error("NHIE error:", error);
          const errorEmbed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Failed to fetch question. Please try again.")
            .setColor(0xff0000);

          await i.followUp({ embeds: [errorEmbed] });
        }
      });

      collector.on("end", async () => {
        try {
          const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("nhie_get")
              .setLabel("Never Have I Ever")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
          );
          await interaction.editReply({ components: [disabledRow] });
        } catch (e) {}
      });
    } catch (error) {
      console.error("NHIE command error:", error);
      const errorEmbed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription("Failed to fetch question. Please try again.")
        .setColor(0xff0000);

      await interaction.reply({ embeds: [errorEmbed] });
    }
  },
};
