import _ from "lodash";
import Koa from "koa";
import Router from "@koa/router";

import srvs from "@/services";
import createRoutes, { CreateRoutesOptions } from "@/lib/createRoutes";

export type RouteOptions = Pick<
  CreateRoutesOptions,
  | "prefix"
  | "openapi"
  | "operationHook"
  | "handlers"
  | "middlewares"
  | "securityHandlers"
>;

export interface CreateAppOptions {
  createRouter: (app: Koa) => Router | void;
  routes: RouteOptions[];
}

export default function createApp(options: CreateAppOptions) {
  const app = new Koa();

  app.proxy = true;

  const router = options.createRouter(app) || new Router();

  for (const item of options.routes) {
    const {
      prefix,
      openapi,
      operationHook,
      handlers,
      middlewares,
      securityHandlers,
    } = item;
    const routerError = createRoutes({
      prod: srvs.settings.prod,
      prefix,
      router,
      openapi,
      handlers,
      middlewares,
      operationHook,
      securityHandlers,
      handleError: (validateErrors) => {
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
      message += `${spaces}miss security handlers ${missMiddlewares.join(
        " "
      )}\n`;
    }
    console.log(message);
  } else {
    throw routerError;
  }
}
