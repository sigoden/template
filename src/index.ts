import "@/bootstrap";

import * as jwt from "jsonwebtoken";
import * as cors from "kcors";

import runServer from "@/lib/runServer";
import createApp from "@/lib/createApp";
import bearAuth from "@/lib/middlewares/bearAuth";
import * as handlers from "@/handlers";
import * as handlersInner from "@/handlersInner";

runServer(srvs => {
  return createApp({
    beforeRoute: app => {
      app.use(cors({
        origin: "*",
        allowHeaders: "*",
      }));
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
