import * as fs from "fs";
import { getOperations } from "use-openapi";
import { parseOpenApi } from "jsona-openapi-js";


export default function createRoutes({
  router,
  jsonaFile,
  handlers,
  middlewares,
  securityHandlers,
  handleError,
}) {
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

    router[operation.method](operation.path, ...apiMiddlrewares, (ctx) => {
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
    routerError = new Error("openapi createRoutes");
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
