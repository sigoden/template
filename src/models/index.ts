import { Sequelize } from "sequelize";

// AutoGenImportBegin {
import Hello, { HelloAttributes } from "./Hello";
// } AutoGenImportEnd

export function load(sequelize: Sequelize) {
  // AutoGenBootstrapBegin {
  Hello.bootstrap(sequelize);
  // } AutoGenBootstrapEnd
}

export {
  // AutoGenExportBegin {
  Hello,
  HelloAttributes,
  // } AutoGenExportEnd
};
