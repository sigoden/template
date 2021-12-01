import { Sequelize } from "sequelize";

// AutoGenImportBegin {
import User, { UserAttributes } from "./User";
import Post, { PostAttributes } from "./Post";
// } AutoGenImportEnd

export async function setup(sequelize: Sequelize) {
  // AutoGenBootstrapBegin {
  User.bootstrap(sequelize);
  Post.bootstrap(sequelize);
  // } AutoGenBootstrapEnd
}

export {
  // AutoGenExportBegin {
  User,
  UserAttributes,
  Post,
  PostAttributes,
  // } AutoGenExportEnd
};
