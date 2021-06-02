import { Sequelize, Model, DataTypes, NOW } from "sequelize";

export interface PostAttributes {
  // AutoGenIntefaceAttrBegin {
  id?: number;
  userId: number;
  title: string;
  description?: string;
  content: string;
  status?: number;
  createdAt?: Date;
  updatedAt: Date;
  // } AutoGenIntefaceAttrEnd
}

export default class Post extends Model<PostAttributes, Partial<PostAttributes>> {
  // AutoGenModelAttrsBegin {
  public id: number;
  public userId!: number;
  public title!: string;
  public description: string;
  public content!: string;
  public status: number;
  public createdAt: Date;
  public updatedAt!: Date;
  // } AutoGenModelAttrsEnd

  public static bootstrap(sequelize: Sequelize) {
    Post.init(
      {
        // AutoGenColumnDefsBegin {
        id: {
          type: DataTypes.BIGINT().UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.BIGINT().UNSIGNED,
          allowNull: false,
        },
        title: {
          type: DataTypes.STRING(99),
          allowNull: false,
        },
        description: {
          type: DataTypes.STRING(255),
        },
        content: {
          type: DataTypes.TEXT(),
          allowNull: false,
        },
        status: {
          type: DataTypes.TINYINT(),
          defaultValue: 0,
        },
        createdAt: {
          type: DataTypes.DATE(),
          allowNull: false,
          defaultValue: NOW,
        },
        updatedAt: {
          type: DataTypes.DATE(),
          allowNull: false,
        },
        // } AutoGenColumnDefsEnd
      },
      {
        sequelize,
        tableName: "Post",
        timestamps: false,
      },
    );
  }
}
