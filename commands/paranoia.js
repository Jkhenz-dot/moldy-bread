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
    .setName("paranoia")
    .setDescription("Get a paranoia question"),

  async execute(interaction) {
    try {
      // Distribution: 40% API, 40% JSON (AI Generated), 10% Gemini AI
      const random = Math.random();
      let question, footerText;

      if (random < 0.4) {
        // 40% chance to use API
        try {
          const response = await fetch(
            `https://api.truthordarebot.xyz/v1/paranoia?rating=pg&rating=pg13`,
          );
          const data = await response.json();
          question = data.question;
          footerText = `Type: ${data.type} | Rating: ${data.rating} | ID: ${data.id}`;
        } catch (error) {
          console.log("API failed, falling back to JSON questions");
          // Fallback to JSON questions
          const fs = require('fs');
          const path = require('path');
          const jsonPath = path.join(__dirname, '..', 'data', 'paranoia-questions.json');
          const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          question = jsonData.questions[Math.floor(Math.random() * jsonData.questions.length)];
          footerText = `Type: PARANOIA | AI Generated`;
        }
      } else if (random < 0.8) {
        // 40% chance to use JSON file questions (categorized as AI generated)
        try {
          const fs = require('fs');
          const path = require('path');
          const jsonPath = path.join(__dirname, '..', 'data', 'paranoia-questions.json');
          const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          question = jsonData.questions[Math.floor(Math.random() * jsonData.questions.length)];
          footerText = `Type: PARANOIA | AI Generated`;
        } catch (error) {
          console.log("JSON file failed, falling back to API");
          const response = await fetch(
            `https://api.truthordarebot.xyz/v1/paranoia?rating=pg&rating=pg13`,
          );
          const data = await response.json();
          question = data.question;
          footerText = `Type: ${data.type} | Rating: ${data.rating} | ID: ${data.id}`;
        }
      } else {
        // 10% chance (and remaining 20% as fallback) to use Gemini AI
        try {
          // Generate AI question
          const { GoogleGenerativeAI } = require("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
          });

          let attempts = 0;
          do {
            const prompt = `Generate a paranoia question under 60 characters starting with 'Who do you think', 'Who's most likely', 'Who's the', 'Who would you', or 'Who here would'. About the group members. Family-friendly.
              
              Example:
              "Who here is most likely to start a cult?",
                "Who's the 'main character' of the group?",
                "Who's most likely to be a backup dancer?",
                "Who's personality contrasts the most with their looks?",
                "Who do you think has the best taste in music?",
                "Who's most likely to be a game show contestant?",
                "Who here would have children the earliest?",
                "Who's the most emotional?",
                "Who has the worst ego here?",
                "Who's most likely to hide their sexuality?",
                "Who do you think is the healthiest?",
                "Who's most likely to act like an animal?",
                "Who's most likely to read every book in the library?",
                "Who's the most confident person here?",
                "Who is most likely to run out of their own wedding last minute?",
                "Who's most likely to have a secret crush on someone else here?",
                "Who's most likely to write a love letter to their crush?",
                "Who's most likely to sneak/have snuck into a bar underage?",
                "Who do you think has the messiest room?",
                "Who would prefer money over love?",
                  "Who's the most innocent one here?",
         
                "Who's most likely to have a heart attack watching a scary movie?",
              `;

            const result = await model.generateContent(prompt);
            question = result.response.text().trim();
            attempts++;
          } while (false); // Removed question tracking
          footerText = `Type: PARANOIA | AI Generated`;
        } catch (error) {
          console.log("AI generation failed, falling back to API");
          // Fallback to original API
          const response = await fetch(
            "https://api.truthordarebot.xyz/v1/paranoia?rating=pg&rating=pg13",
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
        .setColor(0x9b59b6)
        .setFooter({ text: footerText });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("paranoia_get")
          .setLabel("Paranoia")
          .setStyle(ButtonStyle.Secondary),
      );

      await interaction.reply({ embeds: [resultEmbed], components: [row] });

      const filter = (i) =>
        i.customId === "paranoia_get" && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 300000,
      });

      collector.on("collect", async (i) => {
        await i.deferUpdate();

        try {
          // Use 20% chance for AI on button interactions (old messages)
          const useAI = Math.random() < 0.2;
          let newQuestion, newFooterText;

          if (useAI) {
            try {
              // Generate AI question
              const { GoogleGenerativeAI } = require("@google/generative-ai");
              const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
              const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash-exp",
              });

              let attempts = 0;
              do {
                const prompt =
                  "Generate a paranoia question under 60 characters starting with 'Who do you think', 'Who's most likely', 'Who's the', 'Who would you', or 'Who here would'. About the group members. Family-friendly.";

                const result = await model.generateContent(prompt);
                newQuestion = result.response.text().trim();
                attempts++;
              } while (isQuestionUsed("paranoia", newQuestion) && attempts < 3);

              if (!isQuestionUsed("paranoia", newQuestion)) {
                saveAIQuestion("paranoia", newQuestion);
              }
              newFooterText = `Type: PARANOIA | AI Generated`;
            } catch (error) {
              console.log("AI generation failed, falling back to API");
              // Fallback to original API
              const response = await fetch(
                "https://api.truthordarebot.xyz/v1/paranoia?rating=pg&rating=pg13",
              );
              const data = await response.json();
              newQuestion = data.question;
              newFooterText = `Type: ${data.type} | Rating: ${data.rating} | ID: ${data.id}`;
            }
          } else {
            // Use original API
            const response = await fetch(
              "https://api.truthordarebot.xyz/v1/paranoia?rating=pg&rating=pg13",
            );
            const data = await response.json();
            newQuestion = data.question;
            newFooterText = `Type: ${data.type} | Rating: ${data.rating} | ID: ${data.id}`;
          }

          const newResultEmbed = new EmbedBuilder()
            .setAuthor({
              name: `Requested by ${interaction.user.displayName}`,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(newQuestion)
            .setColor(0x9b59b6)
            .setFooter({ text: newFooterText });

          const newRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("paranoia_get")
              .setLabel("Paranoia")
              .setStyle(ButtonStyle.Secondary),
          );

          await i.followUp({ embeds: [newResultEmbed], components: [newRow] });
        } catch (error) {
          console.error("Paranoia error:", error);
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
            new ButtonBuilder()
              .setCustomId("paranoia_get")
              .setLabel("Paranoia")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
          );
          await interaction.editReply({ components: [disabledRow] });
        } catch (e) {}
      });
    } catch (error) {
      console.error("Paranoia command error:", error);
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription("Failed to fetch question. Please try again.")
        .setColor(0xff0000);

      await interaction.reply({ embeds: [errorEmbed] });
    }
  },
};
