export interface LoginReq {
  body: {
    name: string;
    password: string;
  };
}

export interface HelloReq {
  body: {
    name: string;
    word: string;
  };
}
