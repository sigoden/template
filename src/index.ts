import "./bootstrap";

import * as jwt from "jsonwebtoken";
import * as cors from "kcors";
import * as responseTime from "koa-response-time";
import * as helmet from "koa-helmet";

import runServer from "@/lib/runServer";
import createApp from "@/lib/createApp";
import bearAuth from "@/lib/middlewares/bearAuth";
import * as handlers from "@/handlers";
import * as handlersInner from "@/handlersInner";

runServer(async srvs => {
  return createApp({
    createRouter: app => {

      app.use(cors({
        origin: "*",
        allowHeaders: "*",
      }));
      app.use(responseTime());
      app.use(helmet());
    },
    routes: [
      {
        prefix: "/",
        jsonaFile: "api.jsona",
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
        jsonaFile: "apiInner.jsona",
        handlers: handlersInner,
        middlewares: {},
        securityHandlers: {},
      },
    ],
  });
});
