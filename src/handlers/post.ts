import { Post } from "@/models";
import srvs from "@/services";
import { withPagination } from "@/lib/utils";
import { kisa, okBody } from "@/app";

export default function register() {
  const { errs } = srvs;

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
