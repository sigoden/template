import { Sequelize } from "sequelize";

import Hello from "./Hello";
export { Hello };

export function load(sequelize: Sequelize) {
  Hello.bootstrap(sequelize);
}
