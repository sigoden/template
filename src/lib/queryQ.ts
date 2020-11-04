import Sequelize from "sequelize";

const Op = Sequelize.Op;

export const Ops = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $between: Op.between,
  $notBetween: Op.notBetween,
  $and: Op.and,
  $or: Op.or,
};

const OpKeys = Object.keys(Ops);

export default function queryQ(q: any): void {
  if (q && q.where) {
    q.where = iter(q.where);
  }
}

function iter(obj) {
  if (typeof obj === "object" && obj !== null) {
    if (Array.isArray(obj)) {
      return obj.map(v => iter(v));
    } else {
      const newObj = {};
      Object.keys(obj).forEach(key => {
        const newValue = iter(obj[key]);
        const newKey = OpKeys.indexOf(key) > -1 ? Ops[key] : key;
        newObj[newKey] = newValue;
      });
      return newObj;
    }
  }
  return obj;
}
