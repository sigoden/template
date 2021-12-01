import useKisa, { State, App, Router, HandleValidateError } from "kisa";
import jwt from "jsonwebtoken";
import cors from "@koa/cors";
import helmet from "koa-helmet";
import bodyParser from "koa-bodyparser";
import srvs from "@/services";
import bearAuth from "@/middlewares/bearAuth";
import error from "@/middlewares/error";
import * as Api from "@/generated/api";
import * as ApiInner from "@/generated/apiInner";
import register from "@/handlers";
import registerInner from "@/handlersInner";

interface ApiState {
  auth?: {
    userId: number;
  };
}

const handleValidateError: HandleValidateError = (ctx, errors) => {
  throw srvs.errs.ErrValidation.toError({ extra: errors });
};

const [kisa, mountKisa] = useKisa<
  ApiState,
  Api.Handlers<ApiState>,
  Api.SecurityHandlers<ApiState>
>({
  operations: Api.OPERATIONS,
  errorHandlers: {
    validate: handleValidateError,
  },
  securityHandlers: {
    jwt: (_) =>
      bearAuth("auth", async (token) => {
        return jwt.verify(token, srvs.settings.tokenSecret);
      }),
  },
});

const [kisaInner, mountKisaInner] = useKisa<State, ApiInner.Handlers<State>>({
  prefix: "/_/",
  operations: ApiInner.OPERATIONS,
  errorHandlers: {
    validate: handleValidateError,
  },
});

export { kisa, kisaInner };

export default function createApp() {
  register();
  registerInner();

  const app = new App();
  const router = new Router();
  app.use(error());
  app.use(
    cors({
      origin: "*",
      allowHeaders: "*",
    })
  );
  app.use(helmet());
  app.use(
    bodyParser({
      enableTypes: ["json"],
      onerror: () => {
        throw srvs.errs.ErrValidation.toError();
      },
    })
  );
  mountKisa(router);
  mountKisaInner(router);
  app.use(router.routes());
  app.use(router.allowedMethods());
  return app;
}

export const okBody = { msg: "OK" };
