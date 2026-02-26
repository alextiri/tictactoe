import dotenv from 'dotenv';
import { sequelize } from './config/database.js'; // no .ts, no .js
dotenv.config();

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Connection established!");
  } catch (error) {
    console.error("Unable to connect:", error);
  } finally {
    await sequelize.close();
  }
}

testConnection();
