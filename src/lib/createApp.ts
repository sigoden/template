import * as path from "path";
import * as _ from "lodash";
import * as fs from "fs";
import { promisify } from "util";
import * as Koa from "koa";
import * as bodyParser from "koa-bodyparser";
import * as responseTime from "koa-response-time";
import * as helmet from "koa-helmet";
import * as jwt from "jsonwebtoken";
import * as Router from "koa-router";
import * as cors from "kcors";

import srvs from "@/services";
import createRoutes from "@/lib/createRoutes";

import error from "@/lib/middlewares/error";
import bearAuth from "@/lib/middlewares/bearAuth";

import * as handlers from "@/handlers";

export default async function createApp() {
  const app = new Koa();

  const router = new Router();

  for (const [prefix, jsonaFile] of srvs.settings.routes) {
    const jsonaFilePath = path.resolve(srvs.settings.rootPath, jsonaFile);
    if (!srvs.settings.prod) {
      serveStatic(router, path.basename(jsonaFilePath, ".jsona"), jsonaFilePath);
    }
    const localRouter = prefix === "/" ? router : new Router();
    const routerError = createRoutes({
      router: localRouter,
      jsonaFile: jsonaFilePath,
      handlers,
      middlewares: {},
      securityHandlers: {
        jwt: () => bearAuth("auth", async token => {
          return jwt.verify(token, srvs.settings.tokenSecret);
        }),
      },
      handleError: validateErrors => {
        throw srvs.errs.ErrValidation.toError({ extra: validateErrors });
      },
    });

    handleRouteError(routerError);
    if (prefix !== "/") {
      router.use(prefix, localRouter.routes());
    }
  }

  if (srvs.settings.prod) {
    serveHealth(router);
  } else {
    serveRunSrv(router);
  }

  app.use(responseTime());
  app.use(helmet());
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

  app.use(error());
  app.use(
    bodyParser({
      enableTypes: ["json"],
    }),
  );

  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}

function serveStatic(router: Router, routePath: string, filePath: string) {
  const cache = {};
  router.get("/_/static" + routePath, async ctx => {
    ctx.set("content-type", "text/plain; charset=utf-8");
    if (cache[routePath]) {
      ctx.body = cache[routePath];
      return;
    }
    try {
      const data = await promisify(fs.readFile)(filePath, "utf8");
      cache[routePath] = data;
      ctx.body = data;
    } catch (err) {
      ctx.status = 500;
      ctx.body = err.message;
    }
  });
}

function serveHealth(router: Router) {
  router.get("/_/health", async ctx => {
    try {
      if (srvs.sql) {
        await srvs.sql.query("SELECT 1");
      }
      if (srvs.redis) {
        await srvs.redis.get("key");
      }
      ctx.body = "OK";
    } catch (err) {
      ctx.status = 500;
      ctx.body = err.message;
    }
  });
}

function serveRunSrv(router: Router) {
  const getParent = path => {
    const dot = path.lastIndexOf(".");
    const bracket = path.lastIndexOf("]");
    const post = Math.max(dot, bracket);
    if (post > -1) {
      return path.slice(0, dot);
    }
    return path;
  };

  router.post("/_/srvs", async ctx => {
    const { path, args, ret = true } = ctx.request.body;
    const parent = getParent(path);
    const fn = _.get(srvs, path);
    if (!fn) {
      throw new Error(`srvs${path} miss`);
    }
    const retValue = await fn.apply(_.get(srvs, parent), args);
    if (ret) {
      ctx.body = retValue;
    } else {
      ctx.body = "";
    }
  });
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
