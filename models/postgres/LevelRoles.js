const database = require('../../utils/database');

class LevelRoles {
  static async find(query = {}) {
    try {
      let sqlQuery = 'SELECT * FROM level_roles';
      const values = [];
      
      if (Object.keys(query).length > 0) {
        const whereClause = [];
        let paramIndex = 1;
        
        Object.keys(query).forEach(key => {
          if (key === 'roleId') {
            whereClause.push(`role_id = $${paramIndex}`);
          } else {
            whereClause.push(`${key} = $${paramIndex}`);
          }
          values.push(query[key]);
          paramIndex++;
        });
        
        sqlQuery += ' WHERE ' + whereClause.join(' AND ');
      }
      
      sqlQuery += ' ORDER BY level';
      
      const result = await database.query(sqlQuery, values);
      return result.rows;
    } catch (error) {
      console.error('Error finding level roles:', error);
      return [];
    }
  }

  static async findOne(query) {
    try {
      const whereClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(query).forEach(key => {
        if (key === 'roleId') {
          whereClause.push(`role_id = $${paramIndex}`);
        } else {
          whereClause.push(`${key} = $${paramIndex}`);
        }
        values.push(query[key]);
        paramIndex++;
      });

      const sqlQuery = `SELECT * FROM level_roles WHERE ${whereClause.join(' AND ')} LIMIT 1`;
      const result = await database.query(sqlQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding level role:', error);
      return null;
    }
  }

  static async create(levelRoleData) {
    try {
      const query = `
        INSERT INTO level_roles (level, role_id)
        VALUES ($1, $2)
        RETURNING *
      `;
      const values = [levelRoleData.level, levelRoleData.roleId];
      const result = await database.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating level role:', error);
      return null;
    }
  }

  static async deleteOne(query) {
    try {
      const whereClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(query).forEach(key => {
        if (key === 'roleId') {
          whereClause.push(`role_id = $${paramIndex}`);
        } else {
          whereClause.push(`${key} = $${paramIndex}`);
        }
        values.push(query[key]);
        paramIndex++;
      });

      const sqlQuery = `DELETE FROM level_roles WHERE ${whereClause.join(' AND ')} RETURNING *`;
      const result = await database.query(sqlQuery, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error deleting level role:', error);
      return null;
    }
  }

  static async deleteMany(query = {}) {
    try {
      if (Object.keys(query).length === 0) {
        // Delete all if no query provided
        const sqlQuery = 'DELETE FROM level_roles';
        const result = await database.query(sqlQuery);
        return { deletedCount: result.rowCount };
      }
      
      const whereClause = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(query).forEach(key => {
        if (key === 'roleId') {
          whereClause.push(`role_id = $${paramIndex}`);
        } else {
          whereClause.push(`${key} = $${paramIndex}`);
        }
        values.push(query[key]);
        paramIndex++;
      });

      const sqlQuery = `DELETE FROM level_roles WHERE ${whereClause.join(' AND ')}`;
      const result = await database.query(sqlQuery, values);
      return { deletedCount: result.rowCount };
    } catch (error) {
      console.error('Error deleting level roles:', error);
      return { deletedCount: 0 };
    }
  }
}

module.exports = LevelRoles;