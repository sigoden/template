import * as Koa from "koa";
import * as api from "@/typeApi";
import * as apiInner from "@/typeApiInner";

export type Handler<T> = (req: T, ctx: Koa.ParameterizedContext<KoaContextState>) => Promise<any>;
export interface KoaContextState extends Koa.DefaultState {
  auth?: {
    name: string;
  }
}

export { api, apiInner };
