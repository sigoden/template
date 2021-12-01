import { ServiceOption, createInitFn } from "use-services";
import { sleep } from "@/lib/utils";

export type Option = ServiceOption<any, Service>;

export class Service {
  async delay(seconds: number) {
    await sleep(seconds);
  }

  async echo(data: any) {
    return data;
  }
}

export const init = createInitFn(Service);
