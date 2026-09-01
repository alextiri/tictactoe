export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("game_moves", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    game_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "games",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    player_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id"
      },
      onDelete: "CASCADE"
    },
    move_number: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    symbol: {
      type: Sequelize.ENUM("X", "O"),
      allowNull: false
    },
    square: {
      type: Sequelize.INTEGER,
      allowNull: false
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

  try {
    await queryInterface.addConstraint("game_moves", {
      fields: ["game_id", "square"],
      type: "unique",
      name: "game_moves_game_id_square"
    });
  } catch (err) {
    console.log("Constraint already exists, skipping...");
  }
}

export async function down(queryInterface, Sequelize) {
  try {
    await queryInterface.removeConstraint("game_moves", "game_moves_game_id_square");
  } catch (err) {
    console.log("Constraint does not exist, skipping...");
  }

  await queryInterface.dropTable("game_moves");

  if (queryInterface.sequelize.getDialect() === "postgres") {
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_game_moves_symbol";');
  }
}
