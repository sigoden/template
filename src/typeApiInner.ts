export interface HealthReq {
}

export interface RunSrvsReq {
  body: {
    path: string;
    args: any[];
    ret: boolean;
  };
}

export interface StaticFileReq {
  params: {
    name: string;
  };
}
