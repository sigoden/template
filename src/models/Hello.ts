import { Sequelize, Model, DataTypes } from "sequelize";

export default class Hello extends Model {

  public id!: number;
  public name!: string;
  public word!: string;

  public static bootstrap(sequelize: Sequelize) {
    Hello.init(
      {
        id: {
          type: new DataTypes.INTEGER().UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: new DataTypes.STRING(128),
          allowNull: false,
        },
        word: {
          type: new DataTypes.TEXT(),
          allowNull: false,
        },
      },
      {
        tableName: "Hello",
        timestamps: false,
        sequelize,
      }
    );
  }
}
