import useServices from "use-services";
import { EventEmitter } from "events";
import _ from "lodash";
import fs from "fs";
import path from "path";
import * as Winston from "@use-services/winston";
import * as IORedis from "@use-services/ioredis";
import * as Sequelize from "@use-services/sequelize";
import * as HttpErr from "@use-services/httperr";
import * as Echo from "@use-services/echo";

import * as errcodes from "@/errcodes";
import { setup } from "@/models";
import * as Mock from "@/lib/mock";
import Redis from "@/lib/redis";

export const emitter = new EventEmitter();

const settings = {
  app: "tempalte",
  host: "0.0.0.0",
  port: 3000,
  prod: false,
  baseDir: process.env.BASE_DIR || process.cwd(),
  staticFiles: {
    api: "api.jsona",
  },

  prefix: "Mr ",
  tokenSecret: "123456",
  tokenExpiresIn: 24 * 60 * 60,
};

const options = {
  settings: {
    init: Echo.init,
    args: settings,
  } as Echo.Option<typeof settings>,
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
      setup: setup,
    },
  } as Sequelize.Option<Sequelize.Service>,
  errs: {
    init: HttpErr.init,
    args: errcodes,
  } as HttpErr.Option<typeof errcodes>,
  mock: {
    init: Mock.init,
    args: {},
  } as Mock.Option,
};

mergeJson(options, "config.json");

const { srvs, init } = useServices(settings.app, options);

export default srvs;

export { options, init, settings };

function mergeJson(data: any, file: string) {
  file = path.resolve(settings.baseDir, file);
  try {
    const content = fs.readFileSync(file, "utf8");
    _.merge(data, JSON.parse(content));
  } catch (err) {}
}
