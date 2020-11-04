import srvs from "@/services";
import * as jwt from "jsonwebtoken";
import { Handler, api } from "@/type";
import { Hello } from "@/models";

export const login: Handler<api.LoginReq> = async (req, ctx) => {
  const { name } = req.body;
  const { tokenExpiresIn, tokenSecret } = srvs.settings;
  const token = jwt.sign({ name }, tokenSecret, { expiresIn: tokenExpiresIn });
  ctx.body = { token };
};

export const hello: Handler<api.HelloReq> = async (req, ctx) => {
  const { prefix } = srvs.settings;
  const { name, word } = req.body;
  await Hello.create({ name, word });
  ctx.body = { message: `${prefix}${name}, ${word}` };
};
