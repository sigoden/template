import { Sequelize, Model, DataTypes, NOW } from "sequelize";

export default class Hello extends Model {

  // AutoGenModelAttrsBegin {
  public id: number;
  public name: string;
  public word: string;
  // } AutoGenModelAttrsEnd

  public static bootstrap(sequelize: Sequelize) {
    Hello.init(
      {
        // AutoGenColumnDefsBegin {
        id: {
          type: DataTypes.INTEGER().UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(128),
          allowNull: false,
        },
        word: {
          type: DataTypes.TEXT(),
          allowNull: false,
        },
        // } AutoGenColumnDefsEnd
      },
      {
        sequelize,
        tableName: "Hello",
        timestamps: false,
      }
    );
  }
}
