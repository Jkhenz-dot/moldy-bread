/**
 * Context Builder Utility
 * Builds comprehensive guild and user context information for AI responses
 */

/**
 * Build comprehensive context string for AI responses
 * @param {Message} message - Discord message object
 * @param {Client} client - Discord client
 * @returns {Promise<string>} - Formatted context string
 */
async function buildContextInfo(message, client) {
  let infoStr = "";
  
  if (message.guild) {
    const guild = message.guild;
    const member = await guild.members.fetch(message.author.id);

    const userInfo = {
      username: message.author.username,
      displayName: message.member?.displayName || message.author.username,
      id: message.author.id,
      createdAt: message.author.createdAt.toDateString(),
      joinedAt: member.joinedAt?.toDateString() || "Unknown",
      nickname: member.nickname || message.member?.displayName,
      roles:
        member.roles.cache
          .filter((r) => r.id !== guild.id)
          .map((r) => r.name)
          .join(", ") || "None",
      highestRole: member.roles.highest.name,
      isBot: message.author.bot,
      voiceChannel: member.voice?.channel
        ? `${member.voice.channel.name} (ID: ${member.voice.channel.id})`
        : "Not Connected",
      presenceStatus: member.presence?.status || "offline",
    };

    const emojis = guild.emojis.cache;
    const emojiStrings = emojis.map((e) =>
      e.animated ? `<a:${e.name}:${e.id}>` : `<:${e.name}:${e.id}>`,
    );

    const guildInfo = {
      name: guild.name,
      id: guild.id,
      createdAt: guild.createdAt.toDateString(),
      memberCount: guild.memberCount,
      roleCount: guild.roles.cache.size,
      emojiCount: emojis.size,
      animatedEmojiCount: emojis.filter((e) => e.animated).size,
      staticEmojiCount: emojis.filter((e) => !e.animated).size,
      boostLevel: guild.premiumTier,
      boostCount: guild.premiumSubscriptionCount,
      verificationLevel: guild.verificationLevel,
      nsfwLevel: guild.nsfwLevel,
      locale: guild.preferredLocale,
      vanityURLCode: guild.vanityURLCode || "None",
      features: guild.features.join(", ") || "None",
    };

    const emojiDisplay = emojiStrings.join(" ");
    const channelInfo = {
      name: message.channel.name,
      id: message.channel.id,
      type: message.channel.type,
      isNSFW: message.channel.nsfw,
    };

    infoStr = `

Your name is ${client.user.username}.

You must always address ${userInfo.username} as ${userInfo.nickname}.
You are a roleplayer. Always reply with 2 to 3 normal sentences and 1 to 2 *roleplay sentence*.
Add "\\n" to separate normal and *roleplay sentences*.
Use Discord server emojis when expressing emotions or reactions, and format them like <emoji_name:emoji_id> or <a:emoji_name:emoji_id> (for animated).

Do not use Unicode emojis or :emoji_name: format. Only use the exact formats provided below.

## Server Emojis
${emojiDisplay}

You are in the **${guildInfo.name}** Discord server.

## Server Information
- Name: ${guildInfo.name}
- ID: ${guildInfo.id}
- Server Tag/Vanity URL: ${guildInfo.vanityURLCode}
- Created At: ${guildInfo.createdAt}
- Members: ${guildInfo.memberCount}
- Roles: ${guildInfo.roleCount}
- Emojis: ${guildInfo.emojiCount} (Animated: ${guildInfo.animatedEmojiCount}, Static: ${guildInfo.staticEmojiCount})
- Boost Level: ${guildInfo.boostLevel} (${guildInfo.boostCount} boosts)
- NSFW Level: ${guildInfo.nsfwLevel}
- Verification Level: ${guildInfo.verificationLevel}
- Locale: ${guildInfo.locale}
- Features: ${guildInfo.features}

## User Information
- Username: ${userInfo.username}
- ID: ${userInfo.id}
- Display Name: ${userInfo.displayName}
- Nickname: ${userInfo.nickname}
- Joined Server: ${userInfo.joinedAt}
- Account Created: ${userInfo.createdAt}
- Roles: ${userInfo.roles}
- Highest Role: ${userInfo.highestRole}
- Voice Channel: ${userInfo.voiceChannel}
- Presence Status: ${userInfo.presenceStatus}
- Bot: ${userInfo.isBot ? "Yes" : "No"}

## Channel Information
- Channel Name: ${channelInfo.name}
- Channel ID: ${channelInfo.id}
- Type: ${channelInfo.type}
- NSFW: ${channelInfo.isNSFW ? "Yes" : "No"}
`.trim();
  }
  
  return infoStr;
}

module.exports = {
  buildContextInfo
};