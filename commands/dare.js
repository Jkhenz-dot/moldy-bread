const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const AIQuestions = require("../models/postgres/AIQuestions");

// Helper functions for AI question storage using MongoDB
async function loadAIQuestions(type) {
  try {
    const doc = await AIQuestions.findOne({ type });
    return doc ? doc.questions.map(q => q.text) : [];
  } catch (error) {
    console.error('Error loading AI questions:', error);
    return [];
  }
}

async function saveAIQuestion(type, question) {
  try {
    const existingQuestions = await loadAIQuestions(type);
    if (!existingQuestions.includes(question)) {
      let doc = await AIQuestions.findOne({ type });
      if (!doc) {
        doc = new AIQuestions({ type, questions: [] });
      }
      
      doc.questions.push({ text: question });
      
      // Keep only last 20 questions
      if (doc.questions.length > 20) {
        doc.questions = doc.questions.slice(-20);
      }
      
      await doc.save();
    }
  } catch (error) {
    console.error('Error saving AI question:', error);
  }
}

async function isQuestionUsed(type, question) {
  try {
    const questions = await loadAIQuestions(type);
    return questions.includes(question);
  } catch (error) {
    console.error('Error checking question usage:', error);
    return false;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dare")
    .setDescription("Get a dare question with interactive options"),

  async execute(interaction) {
    try {
      // Distribution: 40% API, 40% JSON (AI Generated), 10% Gemini AI
      const random = Math.random();
      let question, footerText;

      if (random < 0.4) {
        // 40% chance to use API
        try {
          const response = await fetch(
            `https://api.truthordarebot.xyz/v1/dare?rating=pg&rating=pg13`,
          );
          const data = await response.json();
          question = data.question;
          footerText = `Type: ${data.type} | Rating: ${data.rating} | ID: ${data.id}`;
        } catch (error) {
          console.log("API failed, falling back to JSON questions");
          // Fallback to JSON questions
          const fs = require('fs');
          const path = require('path');
          const jsonPath = path.join(__dirname, '..', 'data', 'dare-questions.json');
          const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          question = jsonData.questions[Math.floor(Math.random() * jsonData.questions.length)];
          footerText = `Type: DARE | AI Generated`;
        }
      } else if (random < 0.8) {
        // 40% chance to use JSON file questions (categorized as AI generated)
        try {
          const fs = require('fs');
          const path = require('path');
          const jsonPath = path.join(__dirname, '..', 'data', 'dare-questions.json');
          const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          question = jsonData.questions[Math.floor(Math.random() * jsonData.questions.length)];
          footerText = `Type: DARE | AI Generated`;
        } catch (error) {
          console.log("JSON file failed, falling back to API");
          const response = await fetch(
            `https://api.truthordarebot.xyz/v1/dare?rating=pg&rating=pg13`,
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
            const prompt = `Generate a unique fun dare under 60 characters. Focus on creative, family-friendly challenges. Be varied and avoid repetitive actions.

Focus on different types:
- Social media challenges
- Creative expressions
- Physical movements
- Voice/sound challenges
- Interaction with others
- Silly performances
- Quick tasks

Avoid repetitive phrases like "Do 10 jumping jacks" or similar patterns.

Examples of good variety:
"Sing the alphabet backwards"
"Text your crush a pickup line"
"Do your best robot dance"
"Call a pizza place and ask if they sell tacos"
"Act like your pet for 2 minutes"
`;

            const result = await model.generateContent(prompt);
            question = result.response.text().trim();
            attempts++;
          } while ((await isQuestionUsed("dare", question)) && attempts < 3);

          if (!(await isQuestionUsed("dare", question))) {
            await saveAIQuestion("dare", question);
          }
          footerText = `Type: DARE | AI Generated`;
        } catch (error) {
          console.log("AI generation failed, falling back to API");
          // Fallback to original API
          const response = await fetch(
            `https://api.truthordarebot.xyz/v1/dare?rating=pg&rating=pg13`,
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
        .setColor(0xe74c3c)
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
                let prompt;
                if (newType === "Truth") {
                  prompt = `Generate a unique personal truth question under 60 characters. Ask about personal experiences, memories, or feelings. Be creative and avoid generic questions.

Focus on varied topics like:
- Childhood memories or school experiences
- Personal fears, dreams, or goals
- Relationships and social situations
- Hobbies, talents, or skills
- Life-changing moments or decisions
- Personal habits or quirks
- Future aspirations or regrets

Make it conversational and engaging. Avoid repetitive phrases like "What's your favorite way to..." or similar patterns.

Examples of good variety:
"Ever been caught lying by your parents?"
"Biggest fear when you were 8 years old?"
"Most embarrassing thing in your search history?"
"Would you rather be famous or rich?"
"Ever had a crush on a teacher?"
`;
                } else if (newType === "Dare") {
                  prompt = `Generate a unique fun dare under 60 characters. Focus on creative, family-friendly challenges. Be varied and avoid repetitive actions.

Focus on different types:
- Social media challenges
- Creative expressions
- Physical movements
- Voice/sound challenges
- Interaction with others
- Silly performances
- Quick tasks

Avoid repetitive phrases like "Do 10 jumping jacks" or similar patterns.

Examples of good variety:
"Sing the alphabet backwards"
"Text your crush a pickup line"
"Do your best robot dance"
"Call a pizza place and ask if they sell tacos"
"Act like your pet for 2 minutes"
`;
                }

                const result = await model.generateContent(prompt);
                newQuestion = result.response.text().trim();
                attempts++;
              } while (
                (await isQuestionUsed(newType.toLowerCase(), newQuestion)) &&
                attempts < 3
              );

              if (!(await isQuestionUsed(newType.toLowerCase(), newQuestion))) {
                await saveAIQuestion(newType.toLowerCase(), newQuestion);
              }
              newFooterText = `Type: ${newType.toUpperCase()} | AI Generated`;
            } catch (error) {
              console.log("AI generation failed, falling back to API");
              // Fallback to original API
              const response = await fetch(
                `https://api.truthordarebot.xyz/v1/${newEndpoint}?rating=pg&rating=pg13`,
              );
              const data = await response.json();
              newQuestion = data.question;
              newFooterText = `Type: ${data.type} | Rating: ${data.rating} | ID: ${data.id}`;
            }
          } else {
            // Use original API
            const response = await fetch(
              `https://api.truthordarebot.xyz/v1/${newEndpoint}?rating=pg&rating=pg13`,
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
      console.error("Dare command error:", error);
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription("Failed to fetch question. Please try again.")
        .setColor(0xff0000);

      await interaction.reply({ embeds: [errorEmbed] });
    }
  },
};