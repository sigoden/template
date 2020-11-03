import { Services, useServices } from "use-services";
import { EventEmitter } from "events";
import * as _ from "lodash";
import * as path from "path";
import * as Winston from "@/lib/services/winston";
import * as IORedis from "@/lib/services/ioredis";
import * as Sequelize from "@/lib/services/sequelize";
import * as HttpErr from "@/lib/services/httperr";
import * as Echo from "@/lib/services/echo";

import * as errcodes from "@/errcodes";
import { Models, load } from "@/models";
import * as settings from "@/settings";
const emitter = new EventEmitter();

const options = {
  logger: {
    init: Winston.init,
    args: {
      console: {
        level: "debug",
      }
    },
  } as Winston.Option<Winston.Service>,
  redis: {
    init: IORedis.init,
    args: {
      host: "0.0.0.0",
      password: "password",
    },
  } as IORedis.Option<IORedis.Service>,
  sql: {
    init: Sequelize.init,
    args: {
      database: "template2",
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
  } as Sequelize.Option<typeof Models, Sequelize.Service>,
  errs: {
    init: HttpErr.init,
    args: errcodes,
  } as HttpErr.Option<typeof errcodes>,
  settings: {
    init: Echo.init,
    args: settings,
  } as Echo.Option<typeof settings>,
  emitter: {
    init: Echo.init,
    args: emitter,
  } as Echo.Option<EventEmitter>,
};


mergeJson(options, "../config.json");

export { options };
export type AppSevices = Services<typeof options>;

const srvs_: AppSevices = {} as any;

export async function init(srvs: AppSevices) {
  const stop = await useServices(srvs, settings.app, emitter, options);
  _.assign(srvs_, srvs);
  return stop;
}

export default srvs_;

function mergeJson(data: any, file: string) {
  file = path.resolve(__dirname, file);
  try {
    _.merge(data, require(file)); // eslint-disable-line
  } catch (err) { }
}
