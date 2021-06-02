export interface SignupReq {
  body: {
    name: string;
    pass: string;
  };
}

export interface LoginReq {
  body: {
    name: string;
    pass: string;
  };
}

export interface ListPostReq {
  query: {
    pageSize: number;
    pageNum: number;
  };
}

export interface CreatePostReq {
  body: {
    title: string;
    description: string;
    content: string;
  };
}

export interface PublishPostReq {
  params: {
    id: number;
  };
}

export interface ListMyPostsReq {
  query: {
    pageSize: number;
    pageNum: number;
  };
}

export interface Post {
  id: number;
  userId: number;
  title: string;
  description: string;
  status: number;
  content: string;
  createdAt: string;
  updateAt: string;
}
