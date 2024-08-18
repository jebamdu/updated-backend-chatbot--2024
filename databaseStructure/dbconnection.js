const { Sequelize } = require("sequelize");
const { v4: uuidv4 } = require('uuid'); // Use the correct import for uuid
const sequelize = new Sequelize('INSP', 'postgres', 'Anbuamma01@', {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
});

const testDbConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connection has been established successfully.");
    } catch (error) {
        console.error("Unable to connect to the database:", error);
    }
};

module.exports = { sequelize, testDbConnection };