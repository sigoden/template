import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import * as _ from "lodash";
import { Handler, apiInner } from "@/type";
import srvs from "@/services";

export const health: Handler<apiInner.HealthReq> = async (req, ctx) => {
  try {
    if (srvs.sql) {
      await srvs.sql.query("SELECT 1");
    }
    if (srvs.redis) {
      await srvs.redis.get("key");
    }
    ctx.body = "OK";
  } catch (err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
};

const cache = {};
export const staticFile: Handler<apiInner.StaticFileReq> = async (req, ctx) => {
  const { name } = req.params;
  const { staticFiles, baseDir } = srvs.settings;
  ctx.set("content-type", "text/plain; charset=utf-8");
  if (cache[name]) {
    ctx.body = cache[name];
    return;
  }
  if (!staticFiles[name]) {
    ctx.status = 404;
    ctx.body = "NOT FOUND";
  }
  try {
    const filePath = path.resolve(baseDir, staticFiles[name]);
    const data = await promisify(fs.readFile)(filePath, "utf8");
    cache[name] = data;
    ctx.body = data;
  } catch (err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
};

export const runSrvs: Handler<apiInner.RunSrvsReq> = async (req, ctx) => {
  const { path, args, ret = true } = req.body;
  const parent = getParent(path);
  const fn = _.get(srvs, path);
  if (!fn) {
    throw new Error(`srvs.${path} miss`);
  }
  const retValue = await fn.apply(_.get(srvs, parent), args);
  if (ret) {
    ctx.body = retValue || "";
  } else {
    ctx.body = "";
  }
};

function getParent(path) {
  const dot = path.lastIndexOf(".");
  const bracket = path.lastIndexOf("]");
  const post = Math.max(dot, bracket);
  if (post > -1) {
    return path.slice(0, dot);
  }
  return path;
}
