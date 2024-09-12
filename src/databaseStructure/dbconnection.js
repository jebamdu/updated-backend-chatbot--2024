import { Sequelize } from "sequelize";
import dotenv from 'dotenv';
dotenv.config();

console.log("url db",process.env.URL_DB);
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

export { sequelize, testDbConnection };