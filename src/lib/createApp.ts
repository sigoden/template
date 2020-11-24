import * as path from "path";
import * as _ from "lodash";
import * as Koa from "koa";
import * as bodyParser from "koa-bodyparser";
import * as Router from "@koa/router";

import srvs from "@/services";
import createRoutes, { CreateRoutesOptions, OperationHookFn } from "@/lib/createRoutes";

import error from "@/lib/middlewares/error";

export type RouteOptions =
  Pick<CreateRoutesOptions, "prefix" | "jsonaFile" | "handlers" | "middlewares" | "securityHandlers">;

export interface CreateAppOptions {
  createRouter: (app: Koa) => Router | void;
  operationHook?: OperationHookFn;
  routes: RouteOptions[];
}

export default function createApp(options: CreateAppOptions) {
  const app = new Koa();

  app.proxy = true;

  const router = options.createRouter(app) || new Router();

  app.use(error());
  app.use(
    bodyParser({
      enableTypes: ["json"],
    }),
  );

  for (const item of options.routes) {
    const { prefix, jsonaFile, handlers, middlewares, securityHandlers } = item;
    const jsonaFilePath = path.resolve(srvs.settings.rootPath, jsonaFile);
    const routerError = createRoutes({
      prod: srvs.settings.prod,
      prefix,
      router,
      jsonaFile: jsonaFilePath,
      handlers,
      middlewares,
      operationHook: options.operationHook,
      securityHandlers,
      handleError: validateErrors => {
        throw srvs.errs.ErrValidation.toError({ extra: validateErrors });
      },
    });

    handleRouteError(routerError);
  }
  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}

function handleRouteError(routerError) {
  if (!routerError) return;
  if (!srvs.settings.prod) {
    let message = routerError.message + "\n";
    const spaces = " ".repeat(2);
    const { missMiddlewares, missSecurityHandlers, missHandlers } = routerError;
    for (const api of missHandlers) {
      message += `${spaces}miss handler ${api.operationId}(${api.method} ${api.path})\n`;
    }
    if (missMiddlewares.length) {
      message += `${spaces}miss middlewares ${missMiddlewares.join(" ")}\n`;
    }
    if (missSecurityHandlers.length) {
      message += `${spaces}miss security handlers ${missMiddlewares.join(" ")}\n`;
    }
    console.log(message);
  } else {
    throw routerError;
  }
}
