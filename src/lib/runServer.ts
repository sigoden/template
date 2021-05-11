import * as http from "http";
import * as stoppable from "stoppable";
import * as pEvent from "p-event";
import * as Koa from "koa";
import { promisify } from "util";
import { AppSevices, init } from "@/services";

export default async function runServer(createApp: (srvs: AppSevices) => Promise<Koa>) {
  let server;
  const srvs: AppSevices = {} as any;
  process.on("unhandledRejection", (reason) => {
    const { logger } = srvs;
    if (logger) srvs.logger.error(reason as any, { unhandledRejection: true });
  });
  process.on("uncaughtException", (err) => {
    const { logger } = srvs;
    if (logger) srvs.logger.error(err, { uncaughtException: true });
  });
  let stop;
  try {
    stop = await init(srvs);
    const { settings } = srvs;
    const { host, port } = settings;
    const app = await createApp(srvs);
    server = stoppable(http.createServer(app.callback()), 7000);
    server.stop = promisify(server.stop);
    server.listen(port, host);
    await pEvent(server, "listening");
    srvs.logger.debug(`server is listening on: ${host}:${port}`);

    await Promise.race([
      ...["SIGINT", "SIGHUP", "SIGTERM"].map(s =>
        pEvent(
          process,
          s,
          // {
          //   rejectionEvents: ["uncaughtException", "unhandledRejection"],
          // },
        ),
      ),
    ]);
  } catch (err) {
    process.exitCode = 1;
    if (srvs.logger) {
      srvs.logger.error(err);
    } else {
      console.log(err);
    }
  } finally {
    if (server && server.stop) {
      try {
        await server.stop();
      } catch (err) {}
      if (srvs.logger) srvs.logger.debug("server close");
    }
    if (stop) await stop();
    setTimeout(() => process.exit(), 10000).unref();
  }
}
