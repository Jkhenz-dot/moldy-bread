const BaseModel = require('./BaseModel');

class TopRoles extends BaseModel {
    constructor() {
        super('top_roles', {
            top1Role: 'top1_role',
            top2Role: 'top2_role',
            top3Role: 'top3_role',
            top4Role: 'top4_role',
            top5Role: 'top5_role'
        });
    }

    static async findOne(query) {
        const instance = new TopRoles();
        return await instance.findOne(query);
    }

    static async create(data) {
        const instance = new TopRoles();
        return await instance.create(data);
    }

    static async update(data) {
        try {
            const instance = new TopRoles();
            const database = require('../../utils/database');
            const sql = `
                UPDATE ${instance.tableName} 
                SET top1_role = $1, top2_role = $2, top3_role = $3, top4_role = $4, top5_role = $5
                RETURNING *`;
            const values = [
                data.top1_role || data.top1Role || '',
                data.top2_role || data.top2Role || '',
                data.top3_role || data.top3Role || '',
                data.top4_role || data.top4Role || '',
                data.top5_role || data.top5Role || ''
            ];
            const result = await database.query(sql, values);
            return result.rows[0];
        } catch (error) {
            console.error('[TopRoles] Error in update:', error);
            throw error;
        }
    }

    // Method to update top 5 roles
    static async updateTop5Roles(roles) {
        try {
            const instance = new TopRoles();
            const database = require('../../utils/database');

            const roleData = {
                top1_role: roles.top1Role || roles.top1_role || '',
                top2_role: roles.top2Role || roles.top2_role || '',
                top3_role: roles.top3Role || roles.top3_role || '',
                top4_role: roles.top4Role || roles.top4_role || '',
                top5_role: roles.top5Role || roles.top5_role || ''
            };

            // First check if we have any records
            const existing = await instance.findOne({});
            
            let result;
            if (existing) {
                const sql = `
                    UPDATE ${instance.tableName} 
                    SET top1_role = $1, top2_role = $2, top3_role = $3, top4_role = $4, top5_role = $5
                    WHERE id = $6
                    RETURNING *`;
                const values = [
                    roleData.top1_role,
                    roleData.top2_role,
                    roleData.top3_role,
                    roleData.top4_role,
                    roleData.top5_role,
                    existing.id
                ];
                result = await database.query(sql, values);
            } else {
                const sql = `
                    INSERT INTO ${instance.tableName} 
                    (top1_role, top2_role, top3_role, top4_role, top5_role)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *`;
                const values = [
                    roleData.top1_role,
                    roleData.top2_role,
                    roleData.top3_role,
                    roleData.top4_role,
                    roleData.top5_role
                ];
                result = await database.query(sql, values);
            }
            return result.rows[0];
        } catch (error) {
            console.error('[TopRoles] Error in updateTop5Roles:', error);
            throw error;
        }
    }
}

module.exports = TopRoles;

module.exports = TopRoles;
