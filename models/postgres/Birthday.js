const database = require('../../utils/database');

class Birthday {
  static async findOne(query) {
    try {
      const whereClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(query).forEach(key => {
        if (key === 'userId') {
          whereClause.push(`user_id = $${paramIndex}`);
        } else if (key === 'guildId') {
          whereClause.push(`guild_id = $${paramIndex}`);
        } else {
          whereClause.push(`${key} = $${paramIndex}`);
        }
        values.push(query[key]);
        paramIndex++;
      });

      const sqlQuery = `SELECT * FROM birthdays WHERE ${whereClause.join(' AND ')} LIMIT 1`;
      const result = await database.query(sqlQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding birthday:', error);
      return null;
    }
  }

  static async create(birthdayData) {
    try {
      const query = `
        INSERT INTO birthdays (user_id, username, day, month, year, guild_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const values = [
        birthdayData.userId,
        birthdayData.username,
        birthdayData.day,
        birthdayData.month,
        birthdayData.year,
        birthdayData.guildId
      ];
      const result = await database.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating birthday:', error);
      return null;
    }
  }

  static async find(query = {}) {
    try {
      let sqlQuery = 'SELECT * FROM birthdays';
      const values = [];
      
      if (Object.keys(query).length > 0) {
        const whereClause = [];
        let paramIndex = 1;
        
        Object.keys(query).forEach(key => {
          if (key === 'userId') {
            whereClause.push(`user_id = $${paramIndex}`);
          } else if (key === 'guildId') {
            whereClause.push(`guild_id = $${paramIndex}`);
          } else {
            whereClause.push(`${key} = $${paramIndex}`);
          }
          values.push(query[key]);
          paramIndex++;
        });
        
        sqlQuery += ' WHERE ' + whereClause.join(' AND ');
      }
      
      sqlQuery += ' ORDER BY month, day';
      
      const result = await database.query(sqlQuery, values);
      return result.rows;
    } catch (error) {
      console.error('Error finding birthdays:', error);
      return [];
    }
  }

  static async deleteOne(query) {
    try {
      const whereClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(query).forEach(key => {
        if (key === 'userId') {
          whereClause.push(`user_id = $${paramIndex}`);
        } else if (key === 'guildId') {
          whereClause.push(`guild_id = $${paramIndex}`);
        } else {
          whereClause.push(`${key} = $${paramIndex}`);
        }
        values.push(query[key]);
        paramIndex++;
      });

      const sqlQuery = `DELETE FROM birthdays WHERE ${whereClause.join(' AND ')} RETURNING *`;
      const result = await database.query(sqlQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting birthday:', error);
      return null;
    }
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    try {
      const existing = await this.findOne(query);
      
      if (!existing && options.upsert) {
        return await this.create({ ...query, ...updateData });
      }

      if (!existing) {
        return null;
      }

      const setClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updateData).forEach(key => {
        if (key === 'userId') {
          setClause.push(`user_id = $${paramIndex}`);
        } else if (key === 'guildId') {
          setClause.push(`guild_id = $${paramIndex}`);
        } else {
          setClause.push(`${key} = $${paramIndex}`);
        }
        values.push(updateData[key]);
        paramIndex++;
      });

      setClause.push(`updated_at = NOW()`);
      
      // Add WHERE condition - need to handle both userId and guildId
      const whereClause = [];
      Object.keys(query).forEach(key => {
        if (key === 'userId') {
          whereClause.push(`user_id = $${paramIndex}`);
          values.push(query[key]);
          paramIndex++;
        } else if (key === 'guildId') {
          whereClause.push(`guild_id = $${paramIndex}`);
          values.push(query[key]);
          paramIndex++;
        }
      });

      const sqlQuery = `
        UPDATE birthdays 
        SET ${setClause.join(', ')}
        WHERE ${whereClause.join(' AND ')}
        RETURNING *
      `;

      const result = await database.query(sqlQuery, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating birthday:', error);
      return null;
    }
  }
}

module.exports = Birthday;