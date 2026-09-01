import { sequelize } from "./config/database.js";
import { Umzug, SequelizeStorage } from "umzug";

async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log("Database connected");

    const umzug = new Umzug({
      migrations: {
        glob: "migrations/*.js",
      },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize }),
      logger: console,
    });

    await umzug.up();
    console.log("All migrations executed successfully!");
  } catch (err) {
    console.error("Error running migrations:", err);
  } finally {
    await sequelize.close();
    console.log("Database connection closed");
  }
}

runMigrations();
