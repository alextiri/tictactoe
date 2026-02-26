import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(process.env.NEW_DATABASE_URL!, {
  dialect: 'postgres',
  logging: false,
});
