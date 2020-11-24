import "./bootstrap";

import * as path from "path";
import * as fs from "fs";
import * as jwt from "jsonwebtoken";
import * as cors from "@koa/cors";
import * as helmet from "koa-helmet";
import * as bodyParser from "koa-bodyparser";
import { parseOpenApi } from "jsona-openapi-js";

import runServer from "@/lib/runServer";
import createApp from "@/lib/createApp";
import bearAuth from "@/middlewares/bearAuth";
import error from "@/middlewares/error";
import * as handlers from "@/handlers";
import * as handlersInner from "@/handlersInner";

runServer(async srvs => {
  return createApp({
    createRouter: app => {
      app.use(error());
      app.use(cors({
        origin: "*",
        allowHeaders: "*",
      }));
      app.use(helmet());
      app.use(
        bodyParser({
          enableTypes: ["json"],
        }),
      );
    },
    routes: [
      {
        prefix: "/",
        openapi: loadJsona("api.jsona"),
        handlers,
        middlewares: {},
        securityHandlers: {
          jwt: (_) => bearAuth("auth", async token => {
            return jwt.verify(token, srvs.settings.tokenSecret);
          }),
        },
      },
      {
        prefix: "/_/",
        openapi: loadJsona("apiInner.jsona"),
        handlers: handlersInner,
        middlewares: {},
        securityHandlers: {},
      },
    ],
  });
});

function loadJsona(file: string) {
  file = path.resolve(process.env.CONFIG_DIR || process.cwd(), file);
  const content = fs.readFileSync(file, "utf8");
  return parseOpenApi(content);
}
