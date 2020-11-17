const ErrCodes = {
  ErrInternal: {
    status: 500,
    message: "${message}",
    args: {
      message: "server error",
    },
  },
  ErrValidation: {
    status: 400,
    message: "validation failed",
  },
  ErrAuth: {
    status: 401,
    message: "authorization failed",
  },
  ErrPerm: {
    status: 403,
    message: "permision denied",
  },
  ErrNotFound: {
    status: 404,
    message: "not found",
  },
  ErrNoParamId: {
    status: 404,
    message: "no model found",
  },
  ErrQueryQ: {
    status: 404,
    message: "invalid query q",
  },
};

export = ErrCodes;
