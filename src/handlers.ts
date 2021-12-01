import { User, Post } from "@/models";
import srvs from "@/services";
import { passHash, passVerify, withPagination } from "@/lib/utils";
import { kisa, okBody } from "@/app";

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

  kisa.handlers.listPosts = async (ctx) => {
    const records = await Post.findAll(
      withPagination(
        {
          where: { status: 1 },
        },
        ctx.kisa.query,
        { pageSize: 10 }
      )
    );
    ctx.body = records;
  };

  kisa.handlers.createPost = async (ctx) => {
    const { userId } = ctx.state.auth;
    const post = await Post.create({
      ...ctx.kisa.body,
      userId,
      updatedAt: new Date(),
    });
    ctx.body = post;
  };

  kisa.handlers.publishPost = async (ctx) => {
    const { userId } = ctx.state.auth;
    const { id } = ctx.kisa.params;
    const post = await Post.findByPk(id);
    if (!post || post.userId !== userId) {
      throw errs.ErrNoParamId.toError();
    }
    await Post.update({ status: 1 }, { where: { id } });
    ctx.body = okBody;
  };

  kisa.handlers.listMyPosts = async (ctx) => {
    const { userId } = ctx.state.auth;
    const records = await Post.findAll(
      withPagination(
        {
          where: { userId },
        },
        ctx.kisa.query,
        { pageSize: 10 }
      )
    );
    ctx.body = records;
  };
}
