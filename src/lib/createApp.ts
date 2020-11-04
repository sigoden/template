import * as path from "path";
import * as _ from "lodash";
import * as Koa from "koa";
import * as bodyParser from "koa-bodyparser";
import * as responseTime from "koa-response-time";
import * as helmet from "koa-helmet";
import * as Router from "koa-router";

import srvs from "@/services";
import createRoutes from "@/lib/createRoutes";

import error from "@/lib/middlewares/error";

export interface CreateAppOptions {
  beforeRoute: (app: Koa) => void;
  routes: {
    subpath: string,
    jsonaFile: string,
    handlers: any,
    middlewares: {[k: string]: Koa.Middleware},
    securityHandlers: {[k: string]: (config: string[]) => Koa.Middleware},
  }[];
}

export default function createApp(options: CreateAppOptions) {
  const app = new Koa();

  app.proxy = true;
  
  const router = new Router();

  for (const item of options.routes) {
    const { subpath, jsonaFile, handlers, middlewares, securityHandlers } = item;
    const jsonaFilePath = path.resolve(srvs.settings.rootPath, jsonaFile);
    const localRouter = subpath === "/" ? router : new Router();
    const routerError = createRoutes({
      prod: srvs.settings.prod,
      router: localRouter,
      jsonaFile: jsonaFilePath,
      handlers,
      middlewares,
      securityHandlers,
      handleError: validateErrors => {
        throw srvs.errs.ErrValidation.toError({ extra: validateErrors });
      },
    });

    handleRouteError(routerError);
    if (subpath !== "/") {
      router.use(subpath, localRouter.routes());
    }
  }

  app.use(responseTime());
  app.use(helmet());

  app.use(error());
  app.use(
    bodyParser({
      enableTypes: ["json"],
    }),
  );
  options.beforeRoute(app);

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
