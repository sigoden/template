import srvs from "@/services";
import * as jwt from "jsonwebtoken";
import { Handler, api } from "@/lib/type";

export const login: Handler<api.LoginReq> = async (req, ctx) => {
  const { tokenExpiresIn, tokenSecret } = srvs.settings;
  const token = jwt.sign({ name: ctx.request.body.name }, tokenSecret, { expiresIn: tokenExpiresIn });
  ctx.body = { token };
};

export const hello: Handler<api.HelloReq> = async (req, ctx) => {
  const { prefix } = srvs.settings;
  const { name, word } = ctx.request.body;
  await srvs.sql.Hello.create({ name, word });
  ctx.body = { message: `${prefix}${name}, ${word}` };
};
