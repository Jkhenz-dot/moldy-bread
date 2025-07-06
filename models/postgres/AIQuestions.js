const database = require('../../utils/database');

class AIQuestions {
  static async findOne(query) {
    try {
      const whereClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(query).forEach(key => {
        whereClause.push(`${key} = $${paramIndex}`);
        values.push(query[key]);
        paramIndex++;
      });

      const sqlQuery = `SELECT * FROM ai_questions WHERE ${whereClause.join(' AND ')} LIMIT 1`;
      const result = await database.query(sqlQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding AI question:', error);
      return null;
    }
  }

  static async find(query = {}) {
    try {
      let sqlQuery = 'SELECT * FROM ai_questions';
      const values = [];
      
      if (Object.keys(query).length > 0) {
        const whereClause = [];
        let paramIndex = 1;

        Object.keys(query).forEach(key => {
          whereClause.push(`${key} = $${paramIndex}`);
          values.push(query[key]);
          paramIndex++;
        });
        
        sqlQuery += ` WHERE ${whereClause.join(' AND ')}`;
      }
      
      sqlQuery += ' ORDER BY id DESC';
      const result = await database.query(sqlQuery, values);
      return result.rows;
    } catch (error) {
      console.error('Error finding AI questions:', error);
      return [];
    }
  }

  static async create(data) {
    try {
      const query = `
        INSERT INTO ai_questions (category, question)
        VALUES ($1, $2)
        RETURNING *
      `;
      const values = [data.category, data.question];
      const result = await database.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating AI question:', error);
      return null;
    }
  }

  static async deleteOne(query) {
    try {
      const whereClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(query).forEach(key => {
        whereClause.push(`${key} = $${paramIndex}`);
        values.push(query[key]);
        paramIndex++;
      });

      const sqlQuery = `DELETE FROM ai_questions WHERE ${whereClause.join(' AND ')} RETURNING *`;
      const result = await database.query(sqlQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting AI question:', error);
      return null;
    }
  }

  static async aggregate(pipeline) {
    try {
      // Handle simple aggregation for random selection
      if (pipeline.length === 2 && pipeline[0].$match && pipeline[1].$sample) {
        const category = pipeline[0].$match.category;
        const sampleSize = pipeline[1].$sample.size;
        
        const query = `
          SELECT * FROM ai_questions 
          WHERE category = $1 
          ORDER BY RANDOM() 
          LIMIT $2
        `;
        const result = await database.query(query, [category, sampleSize]);
        return result.rows;
      }
      
      // Fallback for other aggregations
      console.warn('Unsupported aggregation pipeline:', pipeline);
      return [];
    } catch (error) {
      console.error('Error in AI questions aggregation:', error);
      return [];
    }
  }
}

module.exports = AIQuestions;