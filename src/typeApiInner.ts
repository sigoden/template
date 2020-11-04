export interface HealthReq {
}

export interface RunSrvsReq {
  body: {
    path: string;
    args: number[];
    ret: boolean;
  };
}

export interface StaticFileReq {
  params: {
    name: string;
  };
}

