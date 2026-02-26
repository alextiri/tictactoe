import { User } from "./User.js";
import { Game } from "./Game.js";
import { GameMove } from "./GameMove.js";

User.hasMany(Game, { foreignKey: 'player_x_id', as: 'playsAsX' });
Game.belongsTo(User, { foreignKey: 'player_x_id', as: 'playerX' });

User.hasMany(Game, { foreignKey: 'player_o_id', as: 'playsAsO' });
Game.belongsTo(User, { foreignKey: 'player_o_id', as: 'playerO' });

Game.hasMany(GameMove, { foreignKey: 'game_id', as: 'moves'});
GameMove.belongsTo(Game, { foreignKey: 'game_id', as: 'game'});

User.hasMany(GameMove, { foreignKey: 'player_id', as: 'moves'});
GameMove.belongsTo(User, { foreignKey: 'player_id', as: 'player'});

export { User, Game, GameMove}
