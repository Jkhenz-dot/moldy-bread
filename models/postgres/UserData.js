const database = require('../../utils/database');

class UserData {
  static async findOne({ userId }) {
    try {
      const query = 'SELECT * FROM users WHERE user_id = $1';
      const result = await database.query(query, [userId]);
      const user = result.rows[0] || null;
      
      // Parse conversation history from JSON
      if (user && user.conversation_history) {
        try {
          if (typeof user.conversation_history === 'string') {
            user.conversationHistory = JSON.parse(user.conversation_history);
          } else {
            user.conversationHistory = user.conversation_history || [];
          }
        } catch (e) {
          console.error('Error parsing conversation history:', e);
          user.conversationHistory = [];
        }
      } else if (user) {
        user.conversationHistory = [];
      }
      
      return user;
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }

  static async create(userData) {
    try {
      // Use INSERT ... ON CONFLICT to handle duplicates
      const query = `
        INSERT INTO users (user_id, username, xp, level, last_xp_gain, conversation_history)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          username = EXCLUDED.username,
          updated_at = NOW()
        RETURNING *
      `;
      const values = [
        userData.userId,
        userData.username,
        userData.xp || 0,
        userData.level || 0,
        userData.lastXpGain || new Date(),
        JSON.stringify(userData.conversationHistory || [])
      ];
      const result = await database.query(query, values);
      const user = result.rows[0];
      
      // Parse conversation history from JSON for returned data
      if (user && user.conversation_history) {
        try {
          if (typeof user.conversation_history === 'string') {
            user.conversationHistory = JSON.parse(user.conversation_history);
          } else {
            user.conversationHistory = user.conversation_history || [];
          }
        } catch (e) {
          console.error('Error parsing conversation history in create:', e);
          user.conversationHistory = [];
        }
      } else if (user) {
        user.conversationHistory = [];
      }
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  static async findOneAndUpdate({ userId }, updateData, options = {}) {
    try {
      const existingUser = await this.findOne({ userId });
      
      if (!existingUser && options.upsert) {
        // Create new user
        return await this.create({ userId, ...updateData });
      }

      if (!existingUser) {
        return null;
      }

      // Update existing user
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updateData).forEach(key => {
        if (key === 'conversationHistory') {
          setClause.push(`conversation_history = $${paramIndex}`);
          values.push(JSON.stringify(updateData[key]));
        } else if (key === 'lastXpGain') {
          setClause.push(`last_xp_gain = $${paramIndex}`);
          values.push(updateData[key]);
        } else {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(updateData[key]);
        }
        paramIndex++;
      });

      setClause.push(`updated_at = NOW()`);
      values.push(userId);

      const query = `
        UPDATE users 
        SET ${setClause.join(', ')}
        WHERE user_id = $${paramIndex}
        RETURNING *
      `;

      const result = await database.query(query, values);
      const user = result.rows[0];
      
      // Parse conversation history from JSON for returned data
      if (user && user.conversation_history) {
        try {
          if (typeof user.conversation_history === 'string') {
            user.conversationHistory = JSON.parse(user.conversation_history);
          } else {
            user.conversationHistory = user.conversation_history || [];
          }
        } catch (e) {
          console.error('Error parsing conversation history in update:', e);
          user.conversationHistory = [];
        }
      } else if (user) {
        user.conversationHistory = [];
      }
      
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  static async updateOne({ userId }, updateData) {
    return await this.findOneAndUpdate({ userId }, updateData);
  }

  static async find(query = {}) {
    try {
      let sqlQuery = 'SELECT * FROM users';
      const values = [];
      
      if (Object.keys(query).length > 0) {
        const whereClause = [];
        let paramIndex = 1;
        
        Object.keys(query).forEach(key => {
          if (key === 'userId') {
            whereClause.push(`user_id = $${paramIndex}`);
          } else {
            whereClause.push(`${key} = $${paramIndex}`);
          }
          values.push(query[key]);
          paramIndex++;
        });
        
        sqlQuery += ' WHERE ' + whereClause.join(' AND ');
      }
      
      const result = await database.query(sqlQuery, values);
      return result.rows;
    } catch (error) {
      console.error('Error finding users:', error);
      return [];
    }
  }

  static async aggregate(pipeline) {
    try {
      // Handle common aggregation patterns
      if (pipeline.some(stage => stage.$sort && stage.$sort.xp === -1)) {
        // Leaderboard query
        const limit = pipeline.find(stage => stage.$limit)?.$limit || 10;
        const query = `
          SELECT * FROM users 
          WHERE xp > 0 
          ORDER BY xp DESC 
          LIMIT $1
        `;
        const result = await database.query(query, [limit]);
        return result.rows;
      }
      
      // Default: return all users
      const result = await database.query('SELECT * FROM users');
      return result.rows;
    } catch (error) {
      console.error('Error in aggregation:', error);
      return [];
    }
  }

  static async deleteOne({ userId }) {
    try {
      const query = 'DELETE FROM users WHERE user_id = $1 RETURNING *';
      const result = await database.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting user:', error);
      return null;
    }
  }

  static async countDocuments(query = {}) {
    try {
      let sqlQuery = 'SELECT COUNT(*) as count FROM users';
      const values = [];
      
      if (Object.keys(query).length > 0) {
        const whereClause = [];
        let paramIndex = 1;
        
        Object.keys(query).forEach(key => {
          if (key === 'userId') {
            whereClause.push(`user_id = $${paramIndex}`);
          } else {
            whereClause.push(`${key} = $${paramIndex}`);
          }
          values.push(query[key]);
          paramIndex++;
        });
        
        sqlQuery += ' WHERE ' + whereClause.join(' AND ');
      }
      
      const result = await database.query(sqlQuery, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting users:', error);
      return 0;
    }
  }
}

module.exports = UserData;