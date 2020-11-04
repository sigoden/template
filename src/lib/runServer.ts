import * as http from "http";
import * as stoppable from "stoppable";
import * as pEvent from "p-event";
import * as Koa from "koa";
import { promisify } from "util";
import { AppSevices, init } from "@/services";

export default async function runServer(createApp: (srvs: AppSevices) => Koa) {
  let server;
  const srvs: AppSevices = {} as any;
  let stop;
  try {
    stop = await init(srvs);
    const { settings } = srvs;
    const { host, port } = settings;
    const app = createApp(srvs);
    server = stoppable(http.createServer(app.callback()), 7000);
    server.listen(port, host);
    server.stop = promisify(server.stop);
    await pEvent(server, "listening");
    srvs.logger.debug(`server is listening on: ${host}:${port}`);

    process.on("unhandledRejection", (reason) => {
      srvs.logger.error(reason as any, { unhandledRejection: true });
    });
    process.on("uncaughtException", (err) => {
      srvs.logger.error(err, { uncaughtException: true });
    });
    await Promise.race([
      ...["SIGINT", "SIGHUP", "SIGTERM"].map(s =>
        pEvent(process, s, {
          rejectionEvents: ["uncaughtException", "unhandledRejection"],
        }),
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
    if (server) {
      await server.stop();
      if (srvs.logger) srvs.logger.debug("server close");
    }
    if (stop) await stop();
    setTimeout(() => process.exit(), 10000).unref();
  }
}
