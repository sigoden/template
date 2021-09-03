import { Services, useServices } from "use-services";
import { EventEmitter } from "events";
import _ from "lodash";
import fs from "fs";
import path from "path";
import * as Winston from "@/lib/services/winston";
import * as IORedis from "@/lib/services/ioredis";
import * as Sequelize from "@/lib/services/sequelize";
import * as HttpErr from "@/lib/services/httperr";
import * as Echo from "@/lib/services/echo";

import * as errcodes from "@/errcodes";
import { load } from "@/models";
import * as settings from "@/settings";
import * as Mock from "@/business/mock";
import Redis from "@/business/redis";

export const emitter = new EventEmitter();

const options = {
  logger: {
    init: Winston.init,
    args: {
      console: {
        level: "debug",
      },
    },
  } as Winston.Option<Winston.Service>,
  redis: {
    init: IORedis.init,
    args: {
      host: "0.0.0.0",
      password: "password",
    },
    ctor: Redis,
  } as IORedis.Option<Redis>,
  sql: {
    init: Sequelize.init,
    args: {
      database: "template",
      username: "root",
      password: "password",
      options: {
        dialect: "mysql",
        logging: false,
        define: {
          timestamps: false,
          freezeTableName: true,
        },
      },
      load,
    },
  } as Sequelize.Option<Sequelize.Service>,
  errs: {
    init: HttpErr.init,
    args: errcodes,
  } as HttpErr.Option<typeof errcodes>,
  settings: {
    init: Echo.init,
    args: settings,
  } as Echo.Option<typeof settings>,
  mock: {
    init: Mock.init,
    args: {},
  } as Mock.Option,
};

mergeJson(options, "config.json");

export { options };
export type AppSevices = Services<typeof options>;

const srvs: AppSevices = {} as any;

export async function init(srvs_: AppSevices) {
  const stop = await useServices(srvs_, settings.app, emitter, options);
  _.assign(srvs, srvs_);
  return stop;
}

export default srvs;

function mergeJson(data: any, file: string) {
  file = path.resolve(settings.baseDir, file);
  try {
    const content = fs.readFileSync(file, "utf8");
    _.merge(data, JSON.parse(content));
  } catch (err) {}
}
