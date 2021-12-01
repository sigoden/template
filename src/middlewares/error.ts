import srvs from "@/services";
import { Context, Middleware } from "kisa";
import _ from "lodash";
import { HttpError } from "@use-services/httperr";

export default function error(): Middleware {
  const { errs, logger } = srvs;
  return async (ctx, next) => {
    try {
      await next();
      if (typeof ctx.response.body === "undefined") {
        ctx.status = 404;
        ctx.body = errs.ErrNotFound.toJson();
        return;
      }
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status >= 500) {
          logger.error(err, collectHttpInfo(ctx));
        }
        ctx.status = err.status;
        ctx.body = err.toJSON();
        return;
      }
      logger.error(err, collectHttpInfo(ctx));
      ctx.status = 500;
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

function collectHttpInfo(ctx: Context) {
  const { request } = ctx;
  const { url, query, headers, body } = request;
  const { auth, authM } = _.pick(ctx.state, ["auth", "authM"]);
  return {
    url,
    query,
    headers: _.omit(headers, OMIT_HEADERS),
    auth,
    authM,
    body,
  };
}
