const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ai-image')
    .setDescription('Generate high-quality images using AI (FLUX.1-dev & Stable Diffusion)')
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('Detailed description of the image you want to generate')
        .setRequired(true)
        .setMaxLength(500)
    )
    .addStringOption(option =>
      option.setName('style')
        .setDescription('Choose the artistic style for your image')
        .addChoices(
          { name: 'Photorealistic', value: 'photorealistic, highly detailed, 8k resolution' },
          { name: 'Anime/Manga', value: 'anime style, manga art, japanese animation' },
          { name: 'Digital Art', value: 'digital art, concept art, artstation trending' },
          { name: 'Oil Painting', value: 'oil painting, classical art, fine art' },
          { name: 'Watercolor', value: 'watercolor painting, soft colors, artistic' },
          { name: 'Cyberpunk', value: 'cyberpunk style, neon lights, futuristic' },
          { name: 'Fantasy Art', value: 'fantasy art, magical, mystical, enchanted' },
          { name: 'Minimalist', value: 'minimalist style, clean, simple, modern' },
          { name: 'Vintage/Retro', value: 'vintage style, retro, nostalgic, classic' },
          { name: 'Sketch/Drawing', value: 'pencil sketch, hand drawn, artistic sketch' }
        )
    )
    .addStringOption(option =>
      option.setName('size')
        .setDescription('Image dimensions')
        .addChoices(
          { name: 'Square (1024x1024)', value: '1024x1024' },
          { name: 'Portrait (1024x1536)', value: '1024x1536' },
          { name: 'Landscape (1536x1024)', value: '1536x1024' },
          { name: 'Wide (1792x1024)', value: '1792x1024' }
        )
    )
    .addIntegerOption(option =>
      option.setName('quality')
        .setDescription('Generation quality (higher = better but slower)')
        .addChoices(
          { name: 'Fast (15 steps)', value: 15 },
          { name: 'Balanced (25 steps)', value: 25 },
          { name: 'High Quality (35 steps)', value: 35 },
          { name: 'Ultra (50 steps)', value: 50 }
        )
    )
    .addStringOption(option =>
      option.setName('negative')
        .setDescription('What to avoid in the image (optional)')
        .setMaxLength(200)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const prompt = interaction.options.getString('prompt');
    const style = interaction.options.getString('style') || 'photorealistic, highly detailed, 8k resolution';
    const size = interaction.options.getString('size') || '1024x1024';
    const quality = interaction.options.getInteger('quality') || 25;
    const negative = interaction.options.getString('negative') || 'blurry, bad quality, watermark, text, signature, deformed, ugly';
    
    await interaction.deferReply();
    
    // Parse size dimensions
    const [width, height] = size.split('x').map(Number);
    
    const embed = new EmbedBuilder()
      .setTitle('AI Image Generation')
      .setDescription(`**Prompt:** ${prompt}\n**Style:** ${style.split(',')[0]}\n**Size:** ${size}\n**Quality:** ${quality} steps\n\nGenerating with FLUX.1-dev...`)
      .setColor(0x7c3aed);
    
    await interaction.editReply({ embeds: [embed] });
    
    try {
      // Try multiple image generation approaches
      let imageUrl = null;
      let generationMethod = '';
      
      // Method 1: Primary - Use Hugging Face API with HF_TOKEN
      if (process.env.HF_TOKEN) {
        try {
          const fetch = (await import('node-fetch')).default;
          
          // Try FLUX.1-dev model first (best quality)
          const response = await fetch(
            "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.HF_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                inputs: `${prompt}, ${style}, masterpiece, best quality, ultra detailed`,
                parameters: {
                  negative_prompt: negative,
                  num_inference_steps: quality,
                  guidance_scale: 3.5,
                  width: Math.min(width, 1024),
                  height: Math.min(height, 1024)
                }
              }),
              timeout: 30000
            }
          );
          
          if (response.ok && response.headers.get('content-type')?.includes('image')) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            if (buffer.length > 0) {
              const attachment = new AttachmentBuilder(buffer, { name: 'flux-generated.png' });
              
              const successEmbed = new EmbedBuilder()
                .setTitle('Image Generated Successfully')
                .setDescription(`**Prompt:** ${prompt}\n**Style:** ${style.split(',')[0]}\n**Model:** FLUX.1-dev\n**Size:** ${size}\n**Quality:** ${quality} steps`)
                .setImage('attachment://flux-generated.png')
                .setColor(0x00ff00)
                .setFooter({ text: `Generated with FLUX.1-dev • ${new Date().toLocaleTimeString()}` });
              
              await interaction.editReply({ embeds: [successEmbed], files: [attachment] });
              return;
            }
          } else {
            const errorText = await response.text();
            console.log('FLUX model response:', response.status, errorText);
          }
        } catch (e) {
          console.log('Hugging Face FLUX failed:', e.message);
        }
      }
      
      // Method 2: Fallback to Stable Diffusion XL if FLUX fails
      if (process.env.HF_TOKEN) {
        try {
          const fetch = (await import('node-fetch')).default;
          const response = await fetch(
            "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.HF_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                inputs: `${prompt}, ${style}, high quality, detailed`,
                parameters: {
                  negative_prompt: negative,
                  num_inference_steps: Math.min(quality, 30),
                  guidance_scale: 7.5,
                  width: Math.min(width, 1024),
                  height: Math.min(height, 1024)
                }
              }),
              timeout: 30000
            }
          );
          
          if (response.ok && response.headers.get('content-type')?.includes('image')) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            if (buffer.length > 0) {
              const attachment = new AttachmentBuilder(buffer, { name: 'sdxl-generated.png' });
              
              const successEmbed = new EmbedBuilder()
                .setTitle('Image Generated Successfully')
                .setDescription(`**Prompt:** ${prompt}\n**Style:** ${style.split(',')[0]}\n**Model:** Stable Diffusion XL\n**Size:** ${size}\n**Quality:** ${quality} steps`)
                .setImage('attachment://sdxl-generated.png')
                .setColor(0x00ff00)
                .setFooter({ text: `Generated with Stable Diffusion XL • ${new Date().toLocaleTimeString()}` });
              
              await interaction.editReply({ embeds: [successEmbed], files: [attachment] });
              return;
            }
          } else {
            const errorText = await response.text();
            console.log('SDXL model response:', response.status, errorText);
          }
        } catch (e) {
          console.log('Hugging Face SDXL failed:', e.message);
        }
      }

      
      // Method 3: If both HF models fail, show error message
      const errorEmbed = new EmbedBuilder()
        .setTitle('Generation Failed')
        .setDescription(`Sorry, AI image generation failed. This could be due to:\n\n• High server load on Hugging Face models\n• Content policy restrictions\n• API rate limits\n• Network connectivity issues\n\nPlease try again in a few minutes or with a different prompt.`)
        .addFields([
          { name: 'Your Prompt', value: prompt, inline: false },
          { name: 'Suggested Action', value: 'Try simplifying your prompt or using different keywords', inline: false }
        ])
        .setColor(0xff4444)
        .setFooter({ text: 'AI Image Generation • Error' });
      
      await interaction.editReply({ embeds: [errorEmbed] });
      
    } catch (error) {
      console.error('AI image generation error:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('🔧 System Error')
        .setDescription('An unexpected system error occurred during image generation.')
        .addFields([
          { name: 'Error Details', value: error.message || 'Unknown error', inline: false },
          { name: 'Action Required', value: 'Please report this to the bot administrator', inline: false }
        ])
        .setColor(0xff0000)
        .setFooter({ text: 'AI Image Generation • System Error' });
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};