export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("games", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    game_code: {
      type: Sequelize.STRING(6),
      allowNull: false,
      unique: true
    },
    player_x_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    player_o_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id"
      },
      onDelete: "SET NULL"
    },
    board: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: Array(9).fill('')
    },
    current_turn: {
      type: Sequelize.CHAR(1),
      allowNull: false,
      defaultValue: "X"
    },
    winner: {
      type: Sequelize.CHAR(1),
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM("ongoing", "finished"),
      allowNull: false,
      defaultValue: "ongoing"
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
    }
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("games");

  if (queryInterface.sequelize.getDialect() === "postgres") {
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_games_status";');
  }
}
