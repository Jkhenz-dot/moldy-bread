// PostgreSQL model exports - drop-in replacements for MongoDB models
module.exports = {
  UserData: require('./UserData'),
  Birthday: require('./Birthday'),
  LevelRoles: require('./LevelRoles'),
  ReactionRole: require('./ReactionRole'),
  // Add other models as we create them
  AIQuestions: require('../AIQuestions'), // Keep using existing until migrated
};