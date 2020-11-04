import srvs from "@/services";
import Koa from "koa";
import * as _ from "lodash";
import { HttpError } from "@/lib/services/httperr";

export default function error() {
  const { errs, logger } = srvs;
  return async (ctx: Koa.Context, next: Koa.Next) => {
    try {
      await next();
      if (!ctx.response.body) {
        ctx.status = 404;
        ctx.body = errs.ErrNotFound.toJson();
        return;
      }
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status >= 500) {
          logger.error(err, collectHttpInfo(ctx));
        }
        ctx.body = err.toJSON();
        return;
      }
      logger.error(err, collectHttpInfo(ctx));
      ctx.body = errs.ErrInternal.toJson({ message: "server error" });
    }
  };
}

const OMIT_HEADERS = [
  "accept",
  "accept-encoding",
  "accept-language",
  "cache-control",
  "connection ",
  "cookie",
  "host",
  "pragma",
  "referer",
  "user-agent",
];

function collectHttpInfo(ctx: Koa.Context) {
  const { request } = ctx;
  const { url, query, headers, body } = request;
  const { auth, authM } = _.pick(ctx.state, ["auth", "authM"]);
  return { url, query, headers: _.omit(headers, OMIT_HEADERS), auth, authM, body };
}
