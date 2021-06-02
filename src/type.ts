import * as Koa from "koa";
import * as api from "@/typeApi";
import * as apiInner from "@/typeApiInner";

export type Handler<T> = (req: T, ctx: Koa.ParameterizedContext<KoaContextState>) => Promise<any>;

declare module "koa" {
  interface Request {
    body: any;
  }
}

export interface KoaContextState extends Koa.DefaultState {
  auth?: {
    userId: number;
  }
}

export const okBody = { msg: "OK" };

export { api, apiInner };
