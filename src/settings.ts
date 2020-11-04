import * as path from "path";
const settings = {
  app: "tempalte2",
  host: "0.0.0.0",
  port: 3000,
  prod: false,
  routes: [
    ["/", "api.jsona"],
  ],
  rootPath: path.resolve(__dirname, "../"),
  prefix: "Mr ",
  tokenSecret: "123456",
  tokenExpiresIn: 24 * 60 * 60,
};

export = settings;
