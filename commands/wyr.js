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
    .setName("wyr")
    .setDescription("Get a Would You Rather question"),

  async execute(interaction) {
    try {
      // Distribution: 40% API, 40% JSON (AI Generated), 10% Gemini AI
      const random = Math.random();
      let question, footerText;

      if (random < 0.4) {
        // 40% chance to use API
        try {
          const response = await fetch(
            `https://api.truthordarebot.xyz/v1/wyr?rating=pg&rating=pg13`,
          );
          const data = await response.json();
          question = data.question;
          footerText = `Type: ${data.type} | Rating: ${data.rating} | ID: ${data.id}`;
        } catch (error) {
          console.log("API failed, falling back to JSON questions");
          // Fallback to JSON questions
          const fs = require('fs');
          const path = require('path');
          const jsonPath = path.join(__dirname, '..', 'data', 'wyr-questions.json');
          const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          question = jsonData.questions[Math.floor(Math.random() * jsonData.questions.length)];
          footerText = `Type: WYR | AI Generated`;
        }
      } else if (random < 0.8) {
        // 40% chance to use JSON file questions (categorized as AI generated)
        try {
          const fs = require('fs');
          const path = require('path');
          const jsonPath = path.join(__dirname, '..', 'data', 'wyr-questions.json');
          const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          question = jsonData.questions[Math.floor(Math.random() * jsonData.questions.length)];
          footerText = `Type: WYR | AI Generated`;
        } catch (error) {
          console.log("JSON file failed, falling back to API");
          const response = await fetch(
            `https://api.truthordarebot.xyz/v1/wyr?rating=pg&rating=pg13`,
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
            const prompt = `Generate one sentence under 60 characters starting with 'Would' and having 'or' between two choices. Family-friendly question with clear options.
            
            Example:
            "Would you rather have the ability to fly or breathe underwater?",
    
            "Would you rather constantly stumble when walking or constantly studder when speaking?",
              "Would you rather kill one person you know or kill three strangers?",
              "Would you rather have 20 million YouTube subscribers or produce a blockbuster action movie?",
              "Would you rather live in a completely empty room or a room so full of things that the space feels tight?",
              "Would you rather have Doge or Grumpy Cat as a pet?",
              "Would you rather drink 2 cups of trash juice or drink 1 gallon of milk 6 months past expiration?",
              "Would you rather be able to travel at light speed or be able to read minds?",
              "Would you rather have long curly hair or have short straight hair?",
              "Would you rather always be late or always be unprepared?",
              "Would you rather speak everything in surround sound or have your own entrance theme when you walk in a room?",
              "Would you rather be forced to watch TV all the time or not watch TV at all?",
              "Would you rather have no eyebrows or have a unibrow?",
              "Would you rather be constantly followed by 32 ducks for the rest of your life or have 4 meters long arms?",
              "If while earning a PhD you were offered a high paying job would you rather complete the degree or bail for the $?",
              "For the rest of your life, would you rather eat what you find in a dump or eat sealife from the bottom of the sea?",
              "Would you rather be on the front page of Reddit whenever or the front page of the NYT once?",
              "Would you rather live on normally or have the LAST 5 would you rathers become true?",
              "Would you rather only have water for a whole month or only soda for a whole month?",
              "Would you rather be starving for the rest of your life or obese for the rest of your life?",
            
            
            
            
            `;

            const result = await model.generateContent(prompt);
            question = result.response.text().trim();
            attempts++;
          } while (false); // Removed question tracking
          footerText = `Type: WYR | AI Generated`;
        } catch (error) {
          console.log("AI generation failed, falling back to API");
          // Fallback to original API
          const response = await fetch(
            "https://api.truthordarebot.xyz/v1/wyr?rating=pg&rating=pg13",
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
        .setColor(0xf39c12)
        .setFooter({ text: footerText });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("wyr_get")
          .setLabel("Would You Rather")
          .setStyle(ButtonStyle.Secondary),
      );

      await interaction.reply({ embeds: [resultEmbed], components: [row] });

      const filter = (i) =>
        i.customId === "wyr_get" && i.user.id === interaction.user.id;
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
                  "Generate one sentence under 60 characters starting with 'Would' and having 'or' between two choices. Family-friendly question with clear options.";

                const result = await model.generateContent(prompt);
                newQuestion = result.response.text().trim();
                attempts++;
              } while ((await isQuestionUsed("wyr", newQuestion)) && attempts < 3);

              if (!(await isQuestionUsed("wyr", newQuestion))) {
                await saveAIQuestion("wyr", newQuestion);
              }
              newFooterText = `Type: WYR | AI Generated`;
            } catch (error) {
              console.log("AI generation failed, falling back to API");
              // Fallback to original API
              const response = await fetch(
                "https://api.truthordarebot.xyz/v1/wyr?rating=pg&rating=pg13",
              );
              const data = await response.json();
              newQuestion = data.question;
              newFooterText = `Type: ${data.type} | Rating: ${data.rating} | ID: ${data.id}`;
            }
          } else {
            // Use original API
            const response = await fetch(
              "https://api.truthordarebot.xyz/v1/wyr?rating=pg&rating=pg13",
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
            .setColor(0xf39c12)
            .setFooter({ text: newFooterText });

          const newRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("wyr_get")
              .setLabel("Would You Rather")
              .setStyle(ButtonStyle.Secondary),
          );

          await i.followUp({ embeds: [newResultEmbed], components: [newRow] });
        } catch (error) {
          console.error("WYR error:", error);
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
              .setCustomId("wyr_get")
              .setLabel("Would You Rather")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
          );
          await interaction.editReply({ components: [disabledRow] });
        } catch (e) {}
      });
    } catch (error) {
      console.error("WYR command error:", error);
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription("Failed to fetch question. Please try again.")
        .setColor(0xff0000);

      await interaction.reply({ embeds: [errorEmbed] });
    }
  },
};
