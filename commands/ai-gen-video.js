const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const { spawn } = require('child_process');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai-gen-video')
    .setDescription('Generate video with AI using Hugging Face (Admin only)')
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('Video description prompt')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('model')
        .setDescription('AI model to use')
        .addChoices(
          { name: 'Text-to-Video MS (Default)', value: 'damo-vilab/text-to-video-ms-1.7b' },
          { name: 'ModelScope T2V', value: 'ali-vilab/text-to-video-synthesis' },
          { name: 'Zeroscope V2', value: 'cerspense/zeroscope_v2_576w' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const prompt = interaction.options.getString('prompt');
    const model = interaction.options.getString('model') || 'damo-vilab/text-to-video-ms-1.7b';
    
    await interaction.deferReply();
    
    // Show typing indicator while processing  
    const typingInterval = setInterval(() => {
      interaction.channel?.sendTyping?.().catch(() => {});
    }, 8000);
    
    try {
      const embed = new EmbedBuilder()
        .setTitle('🎬 Generating Video...')
        .setDescription(`Creating video with prompt: "${prompt}"\n\n⚠️ This may take several minutes...`)
        .setColor(0x0099ff);
      
      await interaction.editReply({ embeds: [embed] });
      
      const python = spawn('python3', ['-c', `
import sys
sys.path.append('.')
from ai_utils import hf_api
import asyncio

async def main():
    try:
        result = await hf_api.generate_video("${prompt.replace(/"/g, '\\"')}", "${model}")
        if result:
            with open('generated_video.mp4', 'wb') as f:
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
          if (output.includes('SUCCESS') && fs.existsSync('generated_video.mp4')) {
            const stats = fs.statSync('generated_video.mp4');
            
            if (stats.size > 25 * 1024 * 1024) {
              const errorEmbed = new EmbedBuilder()
                .setTitle('❌ File Too Large')
                .setDescription('Generated video is too large for Discord (>25MB)')
                .setColor(0xff0000);
              
              await interaction.editReply({ embeds: [errorEmbed] });
              fs.unlinkSync('generated_video.mp4');
              return;
            }
            
            const attachment = new AttachmentBuilder('generated_video.mp4', { name: 'ai-generated-video.mp4' });
            
            const successEmbed = new EmbedBuilder()
              .setTitle('✅ Video Generated')
              .setDescription(`Prompt: "${prompt}"\nModel: ${model}`)
              .setColor(0x00ff00);
            
            await interaction.editReply({ embeds: [successEmbed], files: [attachment] });
            
            fs.unlinkSync('generated_video.mp4');
          } else {
            const errorEmbed = new EmbedBuilder()
              .setTitle('❌ Generation Failed')
              .setDescription('Failed to generate video. Please try again later.')
              .setColor(0xff0000);
            
            await interaction.editReply({ embeds: [errorEmbed] });
          }
        } catch (error) {
          const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription('An error occurred during video generation')
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
        .setDescription('Failed to start video generation')
        .setColor(0xff0000);
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};