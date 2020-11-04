import "module-alias/register";

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
      app.use(
        cors({
          origin: "*",
          exposeHeaders: ["Authorization"],
          credentials: true,
          allowMethods: ["GET", "PUT", "POST", "DELETE"],
          allowHeaders: ["Authorization", "Content-Type"],
          keepHeadersOnError: true,
        }),
      );
      return;
    },
    routes: [
      {
        subpath: "/",
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
        subpath: "/_/",
        jsonaFile: "apiInner.jsona",
        handlers: handlersInner,
        middlewares: {},
        securityHandlers: {},
      },
    ],
  });
});
