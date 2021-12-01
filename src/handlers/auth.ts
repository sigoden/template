import { User } from "@/models";
import srvs from "@/services";
import { passHash, passVerify } from "@/lib/utils";
import { kisa } from "@/app";

export default function register() {
  const { errs } = srvs;

  kisa.handlers.signup = async (ctx) => {
    const { name, pass } = ctx.kisa.body;
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

  kisa.handlers.login = async (ctx) => {
    const { name, pass } = ctx.kisa.body;
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
}
