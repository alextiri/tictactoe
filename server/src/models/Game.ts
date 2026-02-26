import { DataTypes, Model, Sequelize } from "sequelize";
import { sequelize } from "../config/database.js";
import { GameMove } from "./GameMove.js";
import { User } from "./User.js";

export class Game extends Model {
    declare id: number;
    declare player_x_id: number;
    declare player_o_id: number | null;
    declare game_code: string;
    declare board: string[];
    declare current_turn: 'X' | 'O';
    declare status: string;
    declare winner: 'X' | 'O' | null;
    declare createdAt: Date;
    declare updatedAt: Date;
    declare moves?: GameMove[];
}

Game.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        player_x_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        player_o_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        game_code: {
            type: DataTypes.STRING(10),
            allowNull: false,
            unique: true
        },
        board: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: { cells: ["","","","","","","","",""] }
        },
        current_turn: {
            type: DataTypes.CHAR(1),
            allowNull: false,
            validate: {
                isIn: [['X', 'O']]
            }
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'waiting'
        },
        winner: {
            type: DataTypes.CHAR(1),
            allowNull: true,
            validate: {
                isIn: [['X', 'O']]
            }
        }
    },
    {
        sequelize,
        modelName: 'Game',
        tableName: 'games',
        timestamps: true,
        underscored: true,
        validate: {
            differentPlayers() {
                if (this.player_o_id && this.player_o_id === this.player_x_id) {
                    throw new Error("Player X and Player O must be different users");
                }
            }
        }

    }
)