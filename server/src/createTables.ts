import { sequelize } from "./config/database.js";
import './models/User.js';
import './models/Game.js';
import './models/GameMove.js';
import './models/associations.js'

async function createTables() {
    try {
        await sequelize.authenticate();
        console.log("Database connected");

        await sequelize.sync({ force: true });
        console.log("Tables created");
    } catch(err) {
        console.log("Unable to create tables", err);
    } finally {
        await sequelize.close();
    }
}

createTables();