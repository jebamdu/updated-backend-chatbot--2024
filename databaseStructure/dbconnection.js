const { Sequelize } = require("sequelize");
const { v4: uuidv4 } = require('uuid'); // Use the correct import for uuid
const sequelize = new Sequelize(process.env.URL_DB, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Adjust as needed
      },
    },
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