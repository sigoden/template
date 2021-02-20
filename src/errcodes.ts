const ErrCodes = {
  ErrInternal: {
    status: 500,
    message: "${message}",
    args: {
      message: "服务异常",
    },
  },
  ErrValidation: {
    status: 400,
    message: "参数错误",
  },
  ErrAuth: {
    status: 401,
    message: "鉴权失败",
  },
  ErrPerm: {
    status: 403,
    message: "权限不足",
  },
  ErrNotFound: {
    status: 404,
    message: "资源不存在",
  },
  ErrNoParamId: {
    status: 404,
    message: "记录不存在",
  },
  ErrQueryQ: {
    status: 404,
    message: "无效Q",
  },
};

export = ErrCodes;
