import { Sequelize } from "sequelize";
import Hello from "./Hello";


export const Models = {
  Hello,
};

export async function load(sequelize: Sequelize) {
  await Promise.all(Object.keys(Models).map(name => Models[name].bootstrap(sequelize)));
  return Models;
}
