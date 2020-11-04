import srvs from "@/services";
import { Service } from "@/lib/services/ioredis";

export default class Redis extends Service {
  public sep = ":";
  public joinKey(...pairs: string[]) {
    return [srvs.settings.app, ...pairs].join(this.sep);
  }
}
