const database = require('../../utils/database');

class BaseModel {
  constructor(tableName, fieldMappings = {}) {
    this.tableName = tableName;
    this.fieldMappings = fieldMappings; // Maps JS field names to DB column names
  }

  mapField(field) {
    return this.fieldMappings[field] || field;
  }

  buildWhereClause(query) {
    const whereClause = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(query).forEach(key => {
      const dbField = this.mapField(key);
      whereClause.push(`${dbField} = $${paramIndex}`);
      values.push(query[key]);
      paramIndex++;
    });

    return { whereClause, values, paramIndex };
  }

  async findOne(query) {
    try {
      const { whereClause, values } = this.buildWhereClause(query);
      let sqlQuery = `SELECT * FROM ${this.tableName}`;
      if (whereClause.length > 0) {
        sqlQuery += ` WHERE ${whereClause.join(' AND ')}`;
      }
      sqlQuery += ' LIMIT 1';
      const result = await database.query(sqlQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error finding ${this.tableName}:`, error);
      return null;
    }
  }

  async deleteMany(query = {}) {
    try {
      let sqlQuery = `DELETE FROM ${this.tableName}`;
      let values = [];

      if (Object.keys(query).length > 0) {
        const { whereClause, values: whereValues } = this.buildWhereClause(query);
        sqlQuery += ` WHERE ${whereClause.join(' AND ')}`;
        values = whereValues;
      }

      const result = await database.query(sqlQuery, values);
      return result.rowCount;
    } catch (error) {
      console.error(`Error deleting from ${this.tableName}:`, error);
      throw error;
    }
  }

  async find(query = {}, orderBy = '') {
    try {
      let sqlQuery = `SELECT * FROM ${this.tableName}`;
      let values = [];

      if (Object.keys(query).length > 0) {
        const { whereClause, values: whereValues } = this.buildWhereClause(query);
        sqlQuery += ` WHERE ${whereClause.join(' AND ')}`;
        values = whereValues;
      }

      if (orderBy) {
        sqlQuery += ` ORDER BY ${orderBy}`;
      }

      const result = await database.query(sqlQuery, values);
      return result.rows;
    } catch (error) {
      console.error(`Error finding ${this.tableName}:`, error);
      return [];
    }
  }

  async create(data) {
    try {
      const fields = Object.keys(data).map(key => this.mapField(key));
      const placeholders = fields.map((_, index) => `$${index + 1}`);
      
      // Handle values properly for JSONB fields
      const values = Object.keys(data).map(key => {
        const value = data[key];
        const dbField = this.mapField(key);
        
        // For conversation_history field, keep as array/object for JSONB
        if (key === 'conversationHistory' || dbField === 'conversation_history') {
          return value; // PostgreSQL will handle JSONB conversion
        }
        return value;
      });

      const query = `
        INSERT INTO ${this.tableName} (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;

      const result = await database.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      return null;
    }
  }

  async deleteOne(query) {
    try {
      const { whereClause, values } = this.buildWhereClause(query);
      const sqlQuery = `DELETE FROM ${this.tableName} WHERE ${whereClause.join(' AND ')} RETURNING *`;
      const result = await database.query(sqlQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      return null;
    }
  }

  async findOneAndUpdate(query, updateData, options = {}) {
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
        const dbField = this.mapField(key);
        setClause.push(`${dbField} = $${paramIndex}`);
        
        // Handle JSON fields properly
        if (key === 'conversationHistory' || dbField === 'conversation_history') {
          // For JSONB fields, PostgreSQL expects the raw JSON object, not a string
          values.push(updateData[key]);
        } else if (typeof updateData[key] === 'object' && updateData[key] !== null && !Array.isArray(updateData[key])) {
          values.push(JSON.stringify(updateData[key]));
        } else {
          values.push(updateData[key]);
        }
        paramIndex++;
      });

      // Timestamp handling removed
      
      const { whereClause } = this.buildWhereClause(query);
      Object.values(query).forEach(value => {
        values.push(value);
        paramIndex++;
      });

      let sqlQuery;
      if (whereClause.length > 0) {
        sqlQuery = `
          UPDATE ${this.tableName} 
          SET ${setClause.join(', ')}
          WHERE ${whereClause.map((clause, index) => 
            clause.replace(`$${index + 1}`, `$${paramIndex - Object.keys(query).length + index}`)
          ).join(' AND ')}
          RETURNING *
        `;
      } else {
        // If no WHERE clause (empty query object), update all rows
        sqlQuery = `
          UPDATE ${this.tableName} 
          SET ${setClause.join(', ')}
          RETURNING *
        `;
      }

      const result = await database.query(sqlQuery, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      return null;
    }
  }

  async aggregate(pipeline) {
    try {
      // Handle common aggregation patterns for compatibility
      if (pipeline.some(stage => stage.$sort && stage.$sort.xp === -1)) {
        const limit = pipeline.find(stage => stage.$limit)?.$limit || 10;
        const query = `
          SELECT * FROM ${this.tableName} 
          WHERE xp > 0 
          ORDER BY xp DESC 
          LIMIT $1
        `;
        const result = await database.query(query, [limit]);
        return result.rows;
      }
      
      const result = await database.query(`SELECT * FROM ${this.tableName}`);
      return result.rows;
    } catch (error) {
      console.error(`Error in aggregation for ${this.tableName}:`, error);
      return [];
    }
  }

  async countDocuments(query = {}) {
    try {
      let sqlQuery = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      let values = [];

      if (Object.keys(query).length > 0) {
        const { whereClause, values: whereValues } = this.buildWhereClause(query);
        sqlQuery += ` WHERE ${whereClause.join(' AND ')}`;
        values = whereValues;
      }

      const result = await database.query(sqlQuery, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error(`Error counting ${this.tableName}:`, error);
      return 0;
    }
  }
}

module.exports = BaseModel;