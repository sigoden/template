import "./bootstrap";

import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import cors from "@koa/cors";
import helmet from "koa-helmet";
import bodyParser from "koa-bodyparser";
import { parse } from "jsona-openapi-js";
import settings from "@/settings";

import runServer from "@/lib/runServer";
import createApp from "@/lib/createApp";
import bearAuth from "@/middlewares/bearAuth";
import error from "@/middlewares/error";
import * as handlers from "@/handlers";
import * as handlersInner from "@/handlersInner";

runServer(async (srvs) => {
  return createApp({
    createRouter: (app) => {
      app.use(error());
      app.use(
        cors({
          origin: "*",
          allowHeaders: "*",
        })
      );
      app.use(helmet());
      app.use(
        bodyParser({
          enableTypes: ["json"],
          onerror: () => {
            throw srvs.errs.ErrValidation.toError();
          },
        })
      );
    },
    routes: [
      {
        prefix: "/",
        openapi: loadJsona("api.jsona"),
        handlers,
        middlewares: {},
        securityHandlers: {
          jwt: (_) =>
            bearAuth("auth", async (token) => {
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
  file = path.resolve(settings.baseDir, file);
  const content = fs.readFileSync(file, "utf8");
  return parse(content);
}
