const { SlashCommandBuilder, MessageFlags, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
} = require("@discordjs/voice");
// Note: @gradio/client will be imported dynamically due to ES module compatibility
const fs = require("fs");
const path = require("path");
const database = require("../utils/database");

// Voice connections map per bot per guild
const voiceConnections = new Map();

// Track active TTS sessions per bot to prevent conflicts
const activeTTSSessions = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("vc-tts")
        .setDescription("Convert text to speech and play in voice channel (Manage Messages only)")
        .addStringOption((option) =>
            option
                .setName("text")
                .setDescription("Text to convert to speech")
                .setRequired(true)
                .setMaxLength(200),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        try {
            // Check if user is in a voice channel
            const member = interaction.member;
            if (!member || !member.voice.channel) {
                await interaction.reply({
                    content: "You need to be in a voice channel to use TTS!",
                    flags: [MessageFlags.Ephemeral],
                });
                return;
            }

            const text = interaction.options.getString("text");
            const voiceChannel = member.voice.channel;
            const botId = interaction.client.user.id;
            const channelId = voiceChannel.id;
            const sessionKey = `${channelId}-${botId}`;

            // Check if THIS specific bot is already speaking in this voice channel
            // Allow different bots to speak simultaneously with isolated connections
            if (activeTTSSessions.has(sessionKey)) {
                const botName = interaction.client.user.username;
                await interaction.reply({
                    content: `${botName} is already speaking in this voice channel. Please wait for me to finish.`,
                    flags: [MessageFlags.Ephemeral],
                });
                return;
            }

            // Mark this channel as having an active TTS session for this bot
            activeTTSSessions.set(sessionKey, {
                botId: botId,
                userId: interaction.user.id,
                startTime: Date.now(),
            });

            // Acknowledge interaction immediately to prevent timeout
            try {
                await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
            } catch (deferError) {
                console.warn("Failed to defer reply (interaction may have expired):", deferError.message);
                // Clear session and return early if interaction is invalid
                activeTTSSessions.delete(sessionKey);
                return;
            }

            // Connect to voice channel  
            const botUsername = interaction.client.user.username;
            const connection = await connectToVoiceChannel(voiceChannel, botId, botUsername);
            if (!connection) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle("Connection Failed")
                    .setDescription("Failed to connect to voice channel")
                    .setColor(0xFF0000);
                try {
                    await interaction.editReply({ embeds: [errorEmbed] });
                } catch (replyError) {
                    console.error("Failed to send error message:", replyError);
                }
                activeTTSSessions.delete(sessionKey);
                return;
            }

            // Determine speed based on bot username
            const isBot1 = botUsername === "Heilos";
            const speed = isBot1 ? 0.7 : 0.5;

            // Generate TTS audio with appropriate speed
            const audioBuffer = await generateTTS(text, interaction, speed);
            if (!audioBuffer) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle("Speech Generation Failed")
                    .setDescription("Failed to generate speech from text")
                    .setColor(0xFF0000);
                try {
                    await interaction.editReply({ embeds: [errorEmbed] });
                } catch (replyError) {
                    console.error("Failed to send error message:", replyError);
                }
                activeTTSSessions.delete(sessionKey);
                return;
            }

            // Play audio
            const success = await playAudio(
                connection,
                audioBuffer,
                interaction,
                text,
            );
            
            try {
                const embed = new EmbedBuilder()
                    .setTitle(success ? "TTS Playing" : "Playback Failed")
                    .setDescription(success ? `"${text}"` : "Failed to play audio")
                    .setColor(success ? 0x00FF00 : 0xFF0000)
                    .setFooter({ text: `Bot: ${botUsername}` });
                await interaction.editReply({ embeds: [embed] });
            } catch (replyError) {
                console.error("Failed to send success/error message:", replyError);
            }

            // Clear the active session when done
            activeTTSSessions.delete(sessionKey);
        } catch (error) {
            console.error("Error in vc-tts command:", error);

            // Clear the active session on error
            const channelId = interaction.member?.voice?.channel?.id;
            if (channelId) {
                const sessionKey = `${channelId}-${interaction.client.user.id}`;
                activeTTSSessions.delete(sessionKey);
            }

            try {
                const errorEmbed = new EmbedBuilder()
                    .setTitle("TTS Error")
                    .setDescription("An error occurred while processing TTS request")
                    .setColor(0xFF0000);
                await interaction.editReply({ embeds: [errorEmbed] });
            } catch (replyError) {
                console.error("Failed to send error reply:", replyError.message);
            }
        }
    },
};

async function connectToVoiceChannel(voiceChannel, botId, botUsername) {
    try {
        const guildId = voiceChannel.guild.id;
        const connectionKey = `${guildId}-${botId}`;
        const existingConnection = voiceConnections.get(connectionKey);

        // If already connected to the same channel, return existing connection
        if (
            existingConnection &&
            existingConnection.joinConfig.channelId === voiceChannel.id &&
            (existingConnection.state.status === VoiceConnectionStatus.Ready ||
             existingConnection.state.status === VoiceConnectionStatus.Connecting)
        ) {
            // Already connected or connecting
            
            // If still connecting, wait for it to be ready
            if (existingConnection.state.status === VoiceConnectionStatus.Connecting) {
                await new Promise((resolve) => {
                    const checkReady = () => {
                        if (existingConnection.state.status === VoiceConnectionStatus.Ready) {
                            resolve();
                        } else {
                            setTimeout(checkReady, 100);
                        }
                    };
                    setTimeout(resolve, 2000); // Max wait 2 seconds
                    checkReady();
                });
            }
            
            return existingConnection;
        }

        // If connected to different channel or connection is broken, destroy old connection
        if (existingConnection) {
            try {
                existingConnection.destroy();
            } catch (destroyError) {
                // Silent cleanup
            }
            voiceConnections.delete(connectionKey);
            // Small delay to prevent rapid reconnection issues
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Create new connection for this specific bot with unique group ID
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false,
            group: `bot-${botId}`, // Unique group per bot to prevent connection sharing
        });

        // Store connection with bot-specific key
        voiceConnections.set(connectionKey, connection);

        // Handle disconnection with auto-reconnect
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            voiceConnections.delete(connectionKey);
            // Try to reconnect after short delay
            setTimeout(() => {
                if (connection.state.status === VoiceConnectionStatus.Disconnected) {
                    try {
                        connection.rejoin();
                    } catch (rejoinError) {
                        // Silent fail on rejoin
                    }
                }
            }, 2000);
        });

        // Wait for connection to be ready with improved error handling
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                resolve(); // Don't reject on timeout, continue with connection
            }, 6000); // Reduced timeout to 6 seconds

            const cleanup = () => {
                clearTimeout(timeout);
                connection.removeAllListeners(VoiceConnectionStatus.Ready);
                connection.removeAllListeners(VoiceConnectionStatus.Disconnected);
                connection.removeAllListeners(VoiceConnectionStatus.Destroyed);
            };

            connection.on(VoiceConnectionStatus.Ready, () => {
                cleanup();
                resolve();
            });

            connection.on(VoiceConnectionStatus.Disconnected, () => {
                cleanup();
                resolve(); // Don't reject, allow retry
            });

            connection.on(VoiceConnectionStatus.Destroyed, () => {
                cleanup();
                reject(new Error('Connection destroyed'));
            });
        });

        return connection;
    } catch (error) {
        console.error(`Error connecting bot ${botUsername} (${botId}) to voice channel:`, error);
        return null;
    }
}

async function generateTTS(text, interaction, speed = 0.5) {
    try {
        // Import @gradio/client dynamically due to ES module compatibility
        const { Client } = await import("@gradio/client");
        const client = await Client.connect("https://tonyassi-voice-clone.hf.space/--replicas/lroc9/");

        // Determine which bot audio file to use based on bot username
        const botUsername = interaction.client.user.username;
        const isBot1 = botUsername === "Heilos";
        const referenceAudioFile = isBot1 ? "bot1.mp3" : "bot2.mp3";
        const referenceAudioPath = path.join(process.cwd(), referenceAudioFile);

        if (!fs.existsSync(referenceAudioPath)) {
            console.error("Reference audio file not found:", referenceAudioPath);
            return null;
        }

        // Read the audio file and convert to blob
        const audioBuffer = fs.readFileSync(referenceAudioPath);
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        
        // Use the correct format: array with text first, then audio blob
        const inputParams = [text, audioBlob];
        const result = await client.predict("/predict", inputParams);

        if (result && result.data && result.data[0]) {
            const audioData = result.data[0];
            const remotePath = audioData.path || audioData;

            // Download the audio file from Gradio server
            const audioUrl = `https://tonyassi-voice-clone.hf.space/--replicas/lroc9/file=${remotePath}`;
            const audioResponse = await fetch(audioUrl);

            if (!audioResponse.ok) {
                console.error(`Failed to download audio: ${audioResponse.status}`);
                return null;
            }

            const arrayBuffer = await audioResponse.arrayBuffer();
            let processedAudioBuffer = Buffer.from(arrayBuffer);

            // Process audio with FFmpeg - fallback to temp files if in-memory fails
            if (speed !== 1.0) {
                try {
                    // Try in-memory processing first
                    const { spawn } = require("child_process");
                    const ffmpeg = spawn('ffmpeg', [
                        '-i', 'pipe:0',
                        '-filter:a', `atempo=${speed}`,
                        '-f', 'wav',
                        'pipe:1'
                    ]);

                    let memoryBuffer = Buffer.alloc(0);
                    let errorOutput = '';
                    
                    ffmpeg.stdout.on('data', (chunk) => {
                        memoryBuffer = Buffer.concat([memoryBuffer, chunk]);
                    });

                    ffmpeg.stderr.on('data', (data) => {
                        errorOutput += data.toString();
                    });

                    ffmpeg.stdin.write(processedAudioBuffer);
                    ffmpeg.stdin.end();

                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            ffmpeg.kill();
                            reject(new Error('FFmpeg timeout'));
                        }, 10000);

                        ffmpeg.on('close', (code) => {
                            clearTimeout(timeout);
                            if (code === 0 && memoryBuffer.length > 0) {
                                processedAudioBuffer = memoryBuffer;
                                resolve();
                            } else {
                                reject(new Error(`FFmpeg failed: ${errorOutput}`));
                            }
                        });
                    });
                } catch (memoryError) {
                    console.warn("In-memory processing failed, using fallback:", memoryError.message);
                    
                    // Fallback to temp file processing
                    try {
                        const { execSync } = require("child_process");
                        const tempInput = path.join(process.cwd(), `temp_${Date.now()}_input.wav`);
                        const tempOutput = path.join(process.cwd(), `temp_${Date.now()}_output.wav`);

                        fs.writeFileSync(tempInput, processedAudioBuffer);
                        execSync(`ffmpeg -i "${tempInput}" -filter:a "atempo=${speed}" "${tempOutput}"`, { stdio: 'pipe' });
                        processedAudioBuffer = fs.readFileSync(tempOutput);

                        // Cleanup temp files
                        try { fs.unlinkSync(tempInput); } catch {}
                        try { fs.unlinkSync(tempOutput); } catch {}
                    } catch (fallbackError) {
                        console.warn("Fallback processing failed, using original audio:", fallbackError.message);
                        // Use original audio if all processing fails
                    }
                }
            }

            // TTS generated successfully (no database logging needed for temporary audio)

            return processedAudioBuffer;
        } else {
            console.error("Invalid result from Gradio API:", result);
            return null;
        }
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
}

async function playAudio(connection, audioBuffer, interaction, text) {
    try {
        const botUsername = interaction.client.user.username;
        const player = createAudioPlayer();

        // Create a readable stream from the buffer
        const { Readable } = require("stream");
        const audioStream = new Readable({
            read() {},
        });
        audioStream.push(audioBuffer);
        audioStream.push(null);

        const resource = createAudioResource(audioStream, {
            inputType: "arbitrary",
            inlineVolume: true,
            metadata: { 
                title: `TTS Audio - ${botUsername}`,
                bot: botUsername,
                botId: interaction.client.user.id
            },
        });

        const botId = interaction.client.user.id;
        player.play(resource);
        const subscription = connection.subscribe(player);

        return new Promise((resolve) => {
            player.on(AudioPlayerStatus.Idle, async () => {
                // TTS played successfully (no database logging needed for temporary audio)

                resolve(true);
            });

            player.on("error", (error) => {
                resolve(false);
            });

            // Add timeout to prevent hanging - reduced to 12s
            setTimeout(() => {
                try {
                    player.stop();
                } catch (stopError) {
                    // Silent fail
                }
                resolve(true); // Return true even on timeout since audio likely played
            }, 12000);
        });
    } catch (error) {
        console.error(`Error playing audio for ${interaction.client.user.username}:`, error);
        return false;
    }
}
