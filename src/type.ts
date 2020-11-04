import * as Koa from "koa";
import * as api from "@/typeApi";

export type Handler<T> = (req: T, ctx: Koa.Context) => Promise<any>;

export { api };
