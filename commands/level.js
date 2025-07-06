const { SlashCommandBuilder, AttachmentBuilder, MessageFlags } = require("discord.js");
const canvacord = require('canvacord');
const { RankCardBuilder, Font } = canvacord;
const UserData = require('../models/postgres/UserData');
const Others = require('../models/postgres/Others');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Check your level')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to check level for')
        .setRequired(false)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser("user") || interaction.user;
    const userId = target.id;

    try {
      // Load fonts for Canvacord
      await Font.loadDefault();
      // Get user data from database
      const userData = await UserData.findOne({ userId: userId });
      
      if (!userData) {
        return interaction.reply({
          content: `${target.username} hasn't earned any XP yet.`,
          flags: MessageFlags.Ephemeral // ephemeral
        });
      }

      const { xp, level } = userData;
      
      // Calculate XP for current and next level
      const calculateLevel = (xp) => Math.floor(Math.sqrt(xp / 250)) + 1;
      const xpForLevel = (level) => Math.pow(level - 1, 2) * 250;
      
      const currentLevelXP = xpForLevel(level);
      const nextLevelXP = xpForLevel(level + 1);
      
      // Calculate user's rank among all users
      const allUsers = await UserData.find();
      // Sort users by XP in descending order
      allUsers.sort((a, b) => b.xp - a.xp);
      const rankPosition = allUsers.findIndex(user => user.user_id === userId) + 1;

      // Fetch user roles
      const member = await interaction.guild.members.fetch(userId);
      const allowedRoleIds = [
        "1206480988000223305", // STAR
        "1206481447582433291", // DIAMOND
        "1206486307874934784", // MILK
        "1206487990965108788", // WRATH
      ];

      const matchingRoles = member.roles.cache
        .filter((role) => allowedRoleIds.includes(role.id))
        .sort((a, b) => b.position - a.position);

      const primaryRole = matchingRoles.first();

      // Build the rank card
      const card = new RankCardBuilder()
        .setUsername(target.username)
        .setDisplayName(target.globalName || target.username)
        .setAvatar(target.displayAvatarURL({ extension: "png", size: 256 }))
        .setCurrentXP(xp - currentLevelXP)
        .setRequiredXP(nextLevelXP - currentLevelXP)
        .setLevel(level)
        .setRank(rankPosition.toString())
        .setTextStyles({
          level: "LVL:",
          xp: "EXP :",
          rank: (primaryRole?.name || "No") + " Role",
        })
        .setStyles({
          statistics: {
            level: {
              text: {
                style: {
                  fontSize: "30px",
                  left: "270px",
                  position: "absolute",
                },
              },
              value: {
                style: {
                  fontSize: "30px",
                },
              },
            },
            rank: {
              text: {
                style: {
                  position: "absolute",
                  marginLeft: "-60px",
                  fontSize: "30px",
                },
              },
              value: {
                style: {
                  position: "absolute",
                  fontSize: "80px",
                  bottom: "80px",
                  left: "500px",
                },
              },
            },
            xp: {
              text: {
                style: {
                  fontSize: "30px",
                  position: "absolute",
                  left: "380px",
                },
              },
              value: {
                style: {
                  fontSize: "30px",
                },
              },
            },
          },
          username: {
            name: {
              style: {
                fontSize: "55px",
                marginTop: "-10px",
                marginLeft: "10px",
                marginBottom: "50px",
              },
            },
            handle: {
              style: {
                fontSize: "30px",
                marginTop: "-60px",
                marginLeft: "10px",
                marginBottom: "70px",
              },
            },
          },
          progressbar: {
            thumb: {
              style: {
                height: "40px",
                bottom: "20px",
                backgroundColor: primaryRole?.hexColor || "white",
                position: "absolute",
              },
            },
            track: {
              style: {
                height: "40px",
                bottom: "20px",
                position: "absolute",
              },
            },
          },
        });

      const buffer = await card.build({ format: "png" });
      const attachment = new AttachmentBuilder(buffer, { name: "rank.png" });

      return interaction.reply({ files: [attachment] });
    } catch (error) {
      console.error('Failed to generate rank card:', error);
      await interaction.reply({
        content: 'Error generating rank card. Please try again later.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};