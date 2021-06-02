import { Sequelize, Model, DataTypes, NOW } from "sequelize";
import * as jwt from "jsonwebtoken";
import srvs from "@/services";

export interface UserAttributes {
  // AutoGenIntefaceAttrBegin {
  id?: number;
  name: string;
  pass: string;
  isForbid?: number;
  createdAt?: Date;
  // } AutoGenIntefaceAttrEnd
}

export default class User extends Model<UserAttributes, Partial<UserAttributes>> {
  // AutoGenModelAttrsBegin {
  public id: number;
  public name!: string;
  public pass!: string;
  public isForbid: number;
  public createdAt: Date;
  // } AutoGenModelAttrsEnd

  public static bootstrap(sequelize: Sequelize) {
    User.init(
      {
        // AutoGenColumnDefsBegin {
        id: {
          type: DataTypes.BIGINT().UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(99),
          allowNull: false,
        },
        pass: {
          type: DataTypes.STRING(99),
          allowNull: false,
        },
        isForbid: {
          type: DataTypes.TINYINT(),
          defaultValue: 0,
        },
        createdAt: {
          type: DataTypes.DATE(),
          allowNull: false,
          defaultValue: NOW,
        },
        // } AutoGenColumnDefsEnd
      },
      {
        sequelize,
        tableName: "User",
        timestamps: false,
      },
    );
  }

  public async withAuthToken() {
    const { tokenExpiresIn, tokenSecret } = srvs.settings;
    const token: string = jwt.sign(
      {
        userId: this.id,
      },
      tokenSecret,
      {
        expiresIn: tokenExpiresIn,
      },
    );
    return {
      id: this.id,
      name: this.name,
      token,
      expireAt: Date.now() + tokenExpiresIn * 1000,
    };
  }
}
