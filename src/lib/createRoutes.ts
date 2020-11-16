import * as fs from "fs";

import { getOperations, Operation } from "use-openapi";
import { parseOpenApi } from "jsona-openapi-js";
import * as Koa from "koa";
import * as Router from "koa-router";

export interface CreateRoutesOptions {
  prefix: string;
  prod: boolean;
  router: Router;
  jsonaFile: string;
  handlers: {[k: string]: any},
  middlewares: {[k: string]: Koa.Middleware},
  securityHandlers: {[k: string]: (config: string[]) => Koa.Middleware},
  handleError: (error: any) => void,
  beforeHook?: (operation: Operation, ctx: Koa.Context) => Promise<void>,
}

export default function createRoutes({
  prefix,
  prod,
  router,
  jsonaFile,
  handlers,
  middlewares,
  securityHandlers,
  handleError,
  beforeHook,
}: CreateRoutesOptions) {
  const content = fs.readFileSync(jsonaFile, "utf8");
  const operations = getOperations(parseOpenApi(content));
  const missMiddlewares = [];
  const missHandlers = [];
  const missSecurityHandlers = [];
  for (const operation of operations) {
    const { method, operationId, path, security, xProps } = operation;
    let passAllCheck = true;
    const handler = handlers[operation.operationId];
    if (!handler) {
      missHandlers.push({ method, operationId, path });
      passAllCheck = false;
    }

    const apiMiddlrewares = [];

    const xMids = xProps["x-middlewares"];
    if (Array.isArray(xMids)) {
      for (const name of xMids) {
        const middleware = middlewares[name];
        if (!middleware) {
          missMiddlewares.push(name);
          passAllCheck = false;
        }
        apiMiddlrewares.push(middleware);
      }
    }

    const securityConfig = retriveSecurity(security);
    if (securityConfig) {
      const { name, config } = securityConfig;
      const securityHandler = securityHandlers[name];
      if (!securityHandler) {
        missSecurityHandlers.push(name);
        passAllCheck = false;
      }
      apiMiddlrewares.push(securityHandler(config));
    }

    if (!passAllCheck) continue;
    if (prod && xProps["x-debugonly"]) continue;

    prefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;

    router[operation.method](prefix + operation.path, ...apiMiddlrewares, async (ctx: Koa.Context) => {
      if (beforeHook) await beforeHook(operation, ctx);
      if (ctx.response.body) return;
      const { request, params, headers, query } = ctx;
      const { body } = request;
      const req = { params, headers, query, body };
      const errors = operation.validate(req);
      if (errors) return handleError(errors);
      return handler(req, ctx);
    });
  }
  let routerError = null;
  if (missMiddlewares.length + missSecurityHandlers.length + missHandlers.length > 0) {
    routerError = new Error(`mount ${jsonaFile} got errors:`);
    Object.assign(routerError, { missMiddlewares, missSecurityHandlers, missHandlers });
  }
  return routerError;
}

function retriveSecurity(security) {
  if (!security) return null;
  if (!security.length) return null;
  security = security[0];
  const name = Object.keys(security)[0];
  if (!name) return null;
  return { name, config: security[name] };
}
