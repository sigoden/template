import { FindOptions } from "sequelize";

import srvs from "@/services";
import queryQ from "@/lib/queryQ";

export async function sleep(seconds: number) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  });
}

/**
 * const records = await Hello.findAndCountAll(withPagination(
 *   {
 *     order: [["id", "DESC"]],
 *   },
 *   req.query,
 *   { pageSize: 20 },
 * ));
 */
export function withPagination(findOpts: FindOptions, pc: PaginationControl, defaultPc: PaginationControl): FindOptions {
  let pageSize: number = defaultPc.pageSize || 10;
  if (pc.pageSize) pageSize = pc.pageSize;
  let pageNo: number = defaultPc.pageNo || 1;
  if (pc.pageNo) pageNo = pc.pageNo;
  const limit = pageSize;
  const offset = (pageNo - 1) * limit;

  return { ...findOpts, limit, offset };
}

export interface PaginationControl {
  pageSize?: number;
  pageNo?: number;
}

/**
 * const records = await Hello.findAndCountAll(withQ(
 *   withPagination(
 *     {
 *       order: [["id", "DESC"]],
 *     },
 *     req.query,
 *     { pageSize: 20 },
 *   ),
 *   req.query,
 *   req.srvs,
 * ));
 */
export function withQ(findOpts: FindOptions, query: { q?: string }): FindOptions {
  const { q = "{}" } = query;
  let qObj: any;
  try {
    qObj = JSON.parse(q);
  } catch (err) {
    throw srvs.errs.ErrQueryQ.toError();
  }
  queryQ(qObj);
  return Object.assign(findOpts, qObj);
}

/**
 * ```
 * const userIter = tableIter<User>(User, 10, instance => (
 *   { where: { id: {[Op.gt]: instance ? instance.id : 0 }}, order: [["id", "asc"]] }
 * ));
 * for await (const users of userIter) {
 *   for (const user of users) {
 *     console.log(user.id);
 *   }
 * }
 * ```
 */
export function tableIter<T>(ModelClass: any, limit: number, getFindOptsFn: (instance: T) => FindOptions) {
  let instance = null;
  let done = false;
  return {
    [Symbol.asyncIterator]() {
      return {
        async next(): Promise<{ done: boolean; value?: T[] }> {
          if (done) return { done: true };
          const where = getFindOptsFn(instance);
          where.limit = limit;
          const instances = await ModelClass.findAll(where);
          instance = instances[instances.length - 1];
          if (!instance) {
            return { done: true };
          }
          done = instances.length < limit;
          return { done: false, value: instances };
        },
      };
    },
  };
}
