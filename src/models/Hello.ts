import { Sequelize, Model, DataTypes, NOW } from "sequelize";

export default class Hello extends Model {

  public word: string;

  public static bootstrap(sequelize: Sequelize) {
    Hello.init(
      {
        id: {
          type: DataTypes.INTEGER().UNSIGNED,
          autoIncrement: true,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(128),
          allowNull: false,
        },
        word: {
          type: DataTypes.TEXT(),
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "Hello",
        timestamps: false,
      }
    );
  }
}
