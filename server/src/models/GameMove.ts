import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";
import { User } from "./User.js";
import { Game } from "./Game.js";

export class GameMove extends Model {
    declare id: number;
    declare game_id: number;
    declare move_number: number;
    declare player_id: number;
    declare symbol: 'X' | 'O';
    declare square: number;
    declare created_at: Date;
    declare player?: User;
    declare game?: Game;
}

GameMove.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        game_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        move_number: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        player_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        symbol: {
            type: DataTypes.CHAR(1),
            allowNull: false,
            validate: {
                isIn: [['X', 'O']]
            }
        },
        square: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
                max: 8
            }
        }
    },
    {
        sequelize,
        modelName: 'GameMove',
        tableName: 'game_moves',
        timestamps: true,
        underscored: true,
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ['game_id', 'move_number']
            },
            {
                unique: true,
                fields: ['game_id', 'square']
            }
        ]
    }
)