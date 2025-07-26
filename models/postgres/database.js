const { Sequelize } = require('sequelize');

class Database {
    constructor() {
        this.sequelize = null;
        this.retryCount = 0;
        this.maxRetries = 5;
    }

    async initialize() {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('DATABASE_URL environment variable is not set');
        }

        const config = {
            logging: false,
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            },
            pool: {
                max: 10,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        };

        while (this.retryCount < this.maxRetries) {
            try {
                this.sequelize = new Sequelize(dbUrl, config);
                await this.sequelize.authenticate();
                console.log('PostgreSQL connection established successfully');
                
                // Initialize models
                await this.initializeModels();
                return this.sequelize;
                
            } catch (error) {
                this.retryCount++;
                console.error(`Database connection attempt ${this.retryCount}/${this.maxRetries} failed:`, error.message);
                
                if (this.retryCount === this.maxRetries) {
                    throw new Error('Failed to connect to database after maximum retries');
                }
                
                // Exponential backoff: 2^n * 1000ms (2s, 4s, 8s, 16s, 32s)
                const delay = Math.min(1000 * Math.pow(2, this.retryCount), 32000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    async initializeModels() {
        // Import models
        const models = [
            require('./BotA'),
            require('./BotB'),
            require('./Experience'),
            require('./UserData'),
            require('./LevelRoles'),
            require('./Birthday'),
            require('./ReactionRole'),
            require('./Reminder'),
            require('./Others')
        ];

        // Initialize each model
        for (const model of models) {
            if (typeof model.initialize === 'function') {
                await model.initialize(this.sequelize);
            }
        }

        console.log('Models initialized successfully');
    }
}

const database = new Database();
module.exports = database;
