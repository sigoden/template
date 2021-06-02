import { Post } from "@/models";
import srvs from "@/services";
import { withPagination } from "@/business/utils";
import { Handler, api, okBody } from "@/type";

export const listPosts: Handler<api.ListPostReq> = async (req, ctx) => {
  const records = await Post.findAll(
    withPagination(
      {
        where: { status: 1 },
      },
      req.query,
      { pageSize: 10 },
    ));
  ctx.body = records;
};

export const createPost: Handler<api.CreatePostReq> = async (req, ctx) => {
  const { userId } = ctx.state.auth;
  const post = await Post.create({
    ...req.body,
    userId,
    updatedAt: new Date(),
  });
  ctx.body = post;
};

export const publishPost: Handler<api.PublishPostReq> = async (req, ctx) => {
  const { errs } = srvs;
  const { userId } = ctx.state.auth;
  const { id } = req.params;
  const post = await Post.findByPk(id);
  if (!post || post.userId !== userId) {
    throw errs.ErrNoParamId.toError();
  }
  await Post.update({ status: 1 }, { where: { id } });
  ctx.body = okBody;
};

export const listMyPosts: Handler<api.ListMyPostsReq> = async (req, ctx) => {
  const { userId } = ctx.state.auth;
  const records = await Post.findAll(
    withPagination(
      {
        where: { userId },
      },
      req.query,
      { pageSize: 10 },
    ));
  ctx.body = records;
};
