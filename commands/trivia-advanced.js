const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Play advanced trivia with multiple categories')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Choose a trivia category')
        .setRequired(false)
        .addChoices(
          { name: 'General Knowledge', value: '9' },
          { name: 'Entertainment: Books', value: '10' },
          { name: 'Entertainment: Film', value: '11' },
          { name: 'Entertainment: Music', value: '12' },
          { name: 'Entertainment: TV', value: '14' },
          { name: 'Entertainment: Video Games', value: '15' },
          { name: 'Science & Nature', value: '17' },
          { name: 'Science: Computers', value: '18' },
          { name: 'Science: Mathematics', value: '19' },
          { name: 'Mythology', value: '20' },
          { name: 'Sports', value: '21' },
          { name: 'Geography', value: '22' },
          { name: 'History', value: '23' },
          { name: 'Politics', value: '24' },
          { name: 'Art', value: '25' },
          { name: 'Celebrities', value: '26' },
          { name: 'Animals', value: '27' }
        )
    )
    .addStringOption(option =>
      option.setName('difficulty')
        .setDescription('Choose difficulty level')
        .setRequired(false)
        .addChoices(
          { name: 'Easy', value: 'easy' },
          { name: 'Medium', value: 'medium' },
          { name: 'Hard', value: 'hard' }
        )
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Choose question type')
        .setRequired(false)
        .addChoices(
          { name: 'Multiple Choice', value: 'multiple' },
          { name: 'True/False', value: 'boolean' }
        )
    ),

  async execute(interaction) {
    const category = interaction.options.getString('category') || '';
    const difficulty = interaction.options.getString('difficulty') || '';
    const type = interaction.options.getString('type') || 'multiple';
    
    let apiUrl = `https://opentdb.com/api.php?amount=1&type=${type}`;
    if (category) apiUrl += `&category=${category}`;
    if (difficulty) apiUrl += `&difficulty=${difficulty}`;

    try {
      await interaction.deferReply();
      
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.response_code !== 0 || !data.results || data.results.length === 0) {
        return interaction.editReply({ 
          content: 'Failed to fetch trivia question. Please try again!' 
        });
      }

      const question = data.results[0];
      const decodedQuestion = decodeHTML(question.question);
      const decodedCorrectAnswer = decodeHTML(question.correct_answer);
      
      let embed, buttons, shuffledAnswers, correctIndex;
      
      if (question.type === 'boolean') {
        // True/False question
        embed = new EmbedBuilder()
          .setTitle('🧠 Advanced Trivia (True/False)')
          .setDescription(`**Category:** ${question.category}\n**Difficulty:** ${question.difficulty.toUpperCase()}\n\n**${decodedQuestion}**`)
          .setColor('#5865F2')
          .setFooter({ text: 'You have 30 seconds to answer!' });

        buttons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('trivia_true')
              .setLabel('True')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('trivia_false')
              .setLabel('False')
              .setStyle(ButtonStyle.Danger)
          );
          
        shuffledAnswers = ['True', 'False'];
        correctIndex = decodedCorrectAnswer === 'True' ? 0 : 1;
      } else {
        // Multiple choice question
        const decodedIncorrectAnswers = question.incorrect_answers.map(answer => decodeHTML(answer));
        const allAnswers = [decodedCorrectAnswer, ...decodedIncorrectAnswers];
        shuffledAnswers = shuffleArray(allAnswers);
        correctIndex = shuffledAnswers.indexOf(decodedCorrectAnswer);
        
        embed = new EmbedBuilder()
          .setTitle('🧠 Advanced Trivia (Multiple Choice)')
          .setDescription(`**Category:** ${question.category}\n**Difficulty:** ${question.difficulty.toUpperCase()}\n\n**${decodedQuestion}**`)
          .addFields(
            { name: 'A)', value: shuffledAnswers[0], inline: true },
            { name: 'B)', value: shuffledAnswers[1], inline: true },
            { name: 'C)', value: shuffledAnswers[2], inline: true },
            { name: 'D)', value: shuffledAnswers[3], inline: true }
          )
          .setColor('#5865F2')
          .setFooter({ text: 'You have 30 seconds to answer!' });

        buttons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('trivia_A')
              .setLabel('A')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('trivia_B')
              .setLabel('B')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('trivia_C')
              .setLabel('C')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('trivia_D')
              .setLabel('D')
              .setStyle(ButtonStyle.Primary)
          );
      }

      await interaction.editReply({ embeds: [embed], components: [buttons] });

      const filter = (i) => i.customId.startsWith('trivia_') && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000 });

      collector.on('collect', async (i) => {
        let selectedIndex, isCorrect, yourAnswer;
        
        if (question.type === 'boolean') {
          selectedIndex = i.customId === 'trivia_true' ? 0 : 1;
          isCorrect = selectedIndex === correctIndex;
          yourAnswer = shuffledAnswers[selectedIndex];
        } else {
          selectedIndex = ['trivia_A', 'trivia_B', 'trivia_C', 'trivia_D'].indexOf(i.customId);
          isCorrect = selectedIndex === correctIndex;
          yourAnswer = `${['A', 'B', 'C', 'D'][selectedIndex]}) ${shuffledAnswers[selectedIndex]}`;
        }
        
        const correctAnswerText = question.type === 'boolean' 
          ? decodedCorrectAnswer 
          : `${['A', 'B', 'C', 'D'][correctIndex]}) ${decodedCorrectAnswer}`;
        
        const resultEmbed = new EmbedBuilder()
          .setTitle(isCorrect ? 'Correct!' : 'Incorrect!')
          .setDescription(`**Question:** ${decodedQuestion}\n\n**Correct Answer:** ${correctAnswerText}\n**Your Answer:** ${yourAnswer}`)
          .setColor(isCorrect ? '#00ff00' : '#ff0000')
          .addFields(
            { name: 'Category', value: question.category, inline: true },
            { name: 'Difficulty', value: question.difficulty.toUpperCase(), inline: true },
            { name: 'Type', value: question.type === 'boolean' ? 'True/False' : 'Multiple Choice', inline: true }
          );

        await i.update({ embeds: [resultEmbed], components: [] });
        collector.stop();
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          const correctAnswerText = question.type === 'boolean' 
            ? decodedCorrectAnswer 
            : `${['A', 'B', 'C', 'D'][correctIndex]}) ${decodedCorrectAnswer}`;
            
          const timeoutEmbed = new EmbedBuilder()
            .setTitle('⏰ Time\'s Up!')
            .setDescription(`**Question:** ${decodedQuestion}\n\n**Correct Answer:** ${correctAnswerText}`)
            .setColor('#ffa500');

          try {
            await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
          } catch (e) {
            // Message might be already updated
          }
        }
      });

    } catch (error) {
      console.error('Trivia error:', error);
      try {
        await interaction.editReply({ 
          content: 'An error occurred while fetching the trivia question. Please try again!' 
        });
      } catch (e) {
        // Handle case where interaction might have expired
      }
    }
  }
};

function decodeHTML(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}