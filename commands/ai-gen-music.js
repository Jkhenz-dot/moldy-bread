const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const { spawn } = require('child_process');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai-gen-music')
    .setDescription('Generate music with AI using Hugging Face (Admin only)')
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('Music description prompt')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('model')
        .setDescription('AI model to use')
        .addChoices(
          { name: 'MusicGen Small (Default)', value: 'facebook/musicgen-small' },
          { name: 'MusicGen Medium', value: 'facebook/musicgen-medium' },
          { name: 'AudioCraft', value: 'facebook/audiocraft-musicgen-small' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const prompt = interaction.options.getString('prompt');
    const model = interaction.options.getString('model') || 'facebook/musicgen-small';
    
    await interaction.deferReply();
    
    // Show typing indicator while processing
    const typingInterval = setInterval(() => {
      interaction.channel?.sendTyping?.().catch(() => {});
    }, 8000);
    
    try {
      const embed = new EmbedBuilder()
        .setTitle('🎵 Generating Music...')
        .setDescription(`Creating music with prompt: "${prompt}"\n\n⏳ This may take up to 2 minutes...`)
        .setColor(0x0099ff);
      
      await interaction.editReply({ embeds: [embed] });
      
      const python = spawn('python3', ['-c', `
import sys
sys.path.append('.')
from ai_utils import hf_api
import asyncio

async def main():
    try:
        result = await hf_api.generate_music("${prompt.replace(/"/g, '\\"')}", "${model}")
        if result:
            with open('generated_music.wav', 'wb') as f:
                f.write(result)
            print("SUCCESS")
        else:
            print("FAILED")
    except Exception as e:
        print(f"ERROR: {e}")

asyncio.run(main())
      `]);
      
      let output = '';
      python.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      python.on('close', async (code) => {
        // Clear typing indicator
        clearInterval(typingInterval);
        
        try {
          if (output.includes('SUCCESS') && fs.existsSync('generated_music.wav')) {
            const attachment = new AttachmentBuilder('generated_music.wav', { name: 'ai-generated-music.wav' });
            
            const successEmbed = new EmbedBuilder()
              .setTitle('✅ Music Generated')
              .setDescription(`Prompt: "${prompt}"\nModel: ${model}`)
              .setColor(0x00ff00);
            
            await interaction.editReply({ embeds: [successEmbed], files: [attachment] });
            
            fs.unlinkSync('generated_music.wav');
          } else {
            const errorEmbed = new EmbedBuilder()
              .setTitle('❌ Generation Failed')
              .setDescription('Failed to generate music. Please try again later.')
              .setColor(0xff0000);
            
            await interaction.editReply({ embeds: [errorEmbed] });
          }
        } catch (error) {
          const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('An error occurred during music generation')
            .setColor(0xff0000);
          
          await interaction.editReply({ embeds: [errorEmbed] });
        }
      });
      
    } catch (error) {
      // Clear typing indicator on error
      if (typeof typingInterval !== 'undefined') {
        clearInterval(typingInterval);
      }
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('Failed to start music generation')
        .setColor(0xff0000);
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};