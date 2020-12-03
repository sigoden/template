import * as path from "path";
const settings = {
  app: "tempalte2",
  host: "0.0.0.0",
  port: 3000,
  prod: false,
  baseDir: process.env.BASE_DIR || path.resolve(__dirname, "../"),
  staticFiles: {
    api: "api.jsona",
  },

  prefix: "Mr ",
  tokenSecret: "123456",
  tokenExpiresIn: 24 * 60 * 60,
};

export = settings;
