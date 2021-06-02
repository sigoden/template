import { User } from "@/models";
import srvs from "@/services";
import { Handler, api } from "@/type";
import { passHash, passVerify } from "@/business/utils";

export const signup: Handler<api.SignupReq> = async (req, ctx) => {
  const { errs } = srvs;
  const { name, pass } = req.body;
  let user = await User.findOne({ where: { name } });
  if (user) {
    throw errs.ErrUserName.toError();
  }
  user = await User.create({
    name,
    pass: await passHash(pass),
  });

  user = await user.reload();
  ctx.body = await user.withAuthToken();
};

export const login: Handler<api.LoginReq> = async (req, ctx) => {
  const { errs } = srvs;
  const { name, pass } = req.body;
  const user = await User.findOne({ where: { name } });
  if (!user) {
    throw errs.ErrNoUser.toError();
  }
  if (user.isForbid) {
    throw errs.ErrForbidUser.toError();
  }
  const ok = await passVerify(pass, user.pass);
  if (!ok) {
    throw errs.ErrCheckPass.toError();
  }
  ctx.body = await user.withAuthToken();
};
