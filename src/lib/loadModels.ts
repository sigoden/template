import { Sequelize } from "sequelize";

export default async function loadModels(sql: Sequelize, models: { [k: string]: any }) {
  for (const key in models) {
    const ModelClass = models[key];
    await ModelClass.bootstrap(sql);
    if (ModelClass["associate"]) {
      await ModelClass["associate"]();
    }
  }
}
