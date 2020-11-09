import srvs from "@/services";
import Koa from "koa";

export default function bearAuth(
  key: string,
  parseToken: (token: string) => Promise<any>,
) {
  const { errs } = srvs;
  return async (ctx: Koa.Context, next: Koa.Next) => {
    const authorization = ctx.headers.authorization;
    if (!authorization) {
      throw errs.ErrAuth.toError();
    }
    const [schema, token] = authorization.split(" ");
    if (!/^Bearer$/i.test(schema) || !token) {
      throw errs.ErrAuth.toError();
    }
    const data = await parseToken(token);
    ctx.state[key] = data;
    await next();
  };
}
