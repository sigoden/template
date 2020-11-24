import { getOperations, Operation } from "use-openapi";
import { OpenAPIV3 } from "openapi-types";
import * as Koa from "koa";
import * as Router from "@koa/router";

export interface CreateRoutesOptions {
  prefix: string;
  prod: boolean;
  router: Router;
  openapi: OpenAPIV3.Document;
  handlers: {[k: string]: any};
  middlewares: {[k: string]: Koa.Middleware};
  securityHandlers: {[k: string]: SecurityHandlerFn};
  handleError: HandlerErrorFn;
  operationHook?: OperationHookFn;
}

export type SecurityHandlerFn = (config: string[]) => Koa.Middleware;
export type HandlerErrorFn = (error: any) => void;
export type OperationHookFn = (operation: Operation, ctx: Koa.Context) => Promise<void>;

export default function createRoutes({
  prefix,
  prod,
  router,
  openapi,
  handlers,
  middlewares,
  securityHandlers,
  handleError,
  operationHook,
}: CreateRoutesOptions) {
  const operations = getOperations(openapi);
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
        continue;
      }
      apiMiddlrewares.push(securityHandler(config));
    }

    if (!passAllCheck) continue;
    if (prod && xProps["x-debugonly"]) continue;

    prefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;

    router[operation.method](prefix + operation.path, ...apiMiddlrewares, async (ctx: Koa.Context) => {
      if (operationHook) await operationHook(operation, ctx);
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
    routerError = new Error(`mount openapi to '${prefix}' got errors:`);
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
