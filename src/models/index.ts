import Hello from "./Hello";
import { Sequelize } from "sequelize";
import loadModels from "@/lib/loadModels";

export const Models = {
  Hello,
};

export async function load(sql: Sequelize) {
  await loadModels(sql, Models);
  return Models;
}
