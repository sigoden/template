import { ServiceOption, InitOption } from "use-services";
import { sleep } from "@/business/utils";

export type Option = ServiceOption<any, Service>;

export async function init(_: InitOption<any, Service>): Promise<Service> {
  return new Service();
}

export class Service {
  async delay(seconds: number) {
    await sleep(seconds);
  }

  async echo(data: any) {
    return data;
  }
}
