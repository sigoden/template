import { Sequelize } from "sequelize";

// AutoGenImportBegin {
import User, { UserAttributes } from "./User";
import Post, { PostAttributes } from "./Post";
// } AutoGenImportEnd

export function load(sequelize: Sequelize) {
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
