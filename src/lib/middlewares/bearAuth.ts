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
    let data: any;
    try {
      data = await parseToken(token);
    } catch (err) {
      throw errs.ErrAuth.toError();
    }
    ctx.state[key] = data;
    await next();
  };
}
