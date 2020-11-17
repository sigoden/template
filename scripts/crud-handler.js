const fs = require("fs");
const { camelCase } = require("change-case");
const { Parser } = require("sql-ddl-to-json-schema");

const DECIMAL_AS_STRING = true;

const [dbFile, tableName] = process.argv.slice(2);
if (!dbFile || !tableName) {
  console.log("Usage: node ./curd-handler.js <dbfile> <table>");
  process.exit();
}

const content = fs.readFileSync(dbFile, "utf8");
const parser = new Parser("mysql");
const tables = parser.feed(content).toCompactJson();
const table = tables.find(v => v.name === tableName);
if (!table) exit(`No table ${tableName} exist in ${dbFile}`);

const modelName = table.options.comment || tableName;
const model = pruneTable(table);
console.log(generate(model));

function generate(model) {
  const idColumn = model.columns.find(v => v.primaryKey === true) || model.columns[0];
  const idName = idColumn.colName;
  return `
import { Handler, apiManage, okBody } from "@/type";
import { Post } from "@/models";
import { withQ, withPagination } from "@/business/utils";

import srvs from "@/services";

export const list${tableName}s: Handler<apiManage.List${tableName}sReq> = async (req, ctx) => {
  const result = await ${tableName}.findAndCountAll(
    withQ(
      withPagination(
        {},
        req.query,
        { pageSize: 10 },
      ),
      req.query,
    ),
  );
  ctx.body = result;
};

export const create${tableName}s: Handler<apiManage.Create${tableName}sReq> = async (req, ctx) => {
  const record = await ${tableName}.create(req.body);
  ctx.body = record;
};

export const getPosts: Handler<apiManage.Get${tableName}sReq> = async (req, ctx) => {
  const record = await ${tableName}.findByPk(req.params.${idName});
  if (!record) {
    throw srvs.errs.ErrNoParamId.toError();
  }
  ctx.body = record;
};

export const update${tableName}s: Handler<apiManage.Update${tableName}sReq> = async (req, ctx) => {
  const record = await ${tableName}.findByPk(req.params.id);
  if (!record) {
    throw srvs.errs.ErrNoParamId.toError();
  }
  await record.update(req.body);
  ctx.body = okBody;
};

export const delete${tableName}s: Handler<apiManage.Delete${tableName}sReq> = async (req, ctx) => {
  const record = await ${tableName}.findByPk(req.params.${idName});
  if (!record) {
    throw srvs.errs.ErrNoParamId.toError();
  }
  await ${tableName}.update({ status: 0 }, { where: { id: req.params.${idName} } });
  ctx.body = okBody;
};

`;
}

function listFields(columns) {
  const spaces = " ".repeat(12);
  let output = "";
  for (const col of columns) {
    output += `\n${spaces}${col.colName}: ${getFieldValue(col)},`;
    if (col.comment) {
      output += ` @description("${col.comment}")`;
    }
  }
  return output;
}

function createFields(columns) {
  const spaces = " ".repeat(8);
  let output = "";

  for (const col of columns) {
    if (col.colName === "id" && col.autoIncrement) {
      continue;
    }
    if (typeof col.defaultValue !== "undefined") {
      continue;
    }
    output += `\n${spaces}${col.colName}: ${getFieldValue(col)},`;
    const nonNull = !col.allowNull && typeof col.defaultValue === "undefined";
    if (!nonNull) {
      output += " @optional";
    }
    if (col.comment) {
      output += ` @description("${col.comment}")`;
    }
  }
  return output;
}

function updateFields(columns) {
  const spaces = " ".repeat(8);
  let output = "";

  for (const col of columns) {
    if (col.colName === "id" && col.autoIncrement) {
      continue;
    }
    if (col.colName === "createdAt" && col.defaultValue === "NOW") {
      continue;
    }
    output += `\n${spaces}${col.colName}: ${getFieldValue(col)}, @optional`;
  }
  return output;
}

function getFieldValue(column) {
  if (typeof column.defaultValue !== "undefined") {
    if (column.defaultValue === "NOW") {
      return "\"<datetime>\"";
    }
    return column.defaultValue;
  }
  switch (column.valueType) {
    case "number":
      return 1;
    case "string":
      return "\"\"";
    case "bool":
      return false;
    case "Date":
      return "\"<datetime>\"";
    default:
      return "\"\"";
  }
}

function exit(msg, exitCode = 1) {
  console.log(msg);
  process.exit(exitCode);
}

function pruneTable(table) {
  const name = table.name;
  const columns = table.columns.map(col => {
    const { valueType } = getType(col.type, col.options.unsigned);
    let defaultValue;
    if (typeof col.options.default !== "undefined") {
      if (col.options.default === "CURRENT_TIMESTAMP") {
        defaultValue = "NOW";
      } else {
        defaultValue = col.options.default;
      }
    }
    return {
      colName: col.name,
      valueType,
      comment: col.options.comment,
      allowNull: col.options.nullable,
      autoIncrement: !!col.options.autoincrement,
      defaultValue,
      primaryKey: !!table.primaryKey.columns.find(v => v.column === col.name),
    };
  });
  return { name, columns };
}

function getType(type, unsigned) {
  if (type.datatype === "int") {
    const suffix = unsigned ? ".UNSIGNED" : "";
    const valueType = "number";
    if (type.width === 1) {
      const sequelizeType = `TINYINT()${suffix}`;
      return { sequelizeType, valueType };
    } else if (type.width === 8) {
      const sequelizeType = `BIGINT()${suffix}`;
      return { sequelizeType, valueType };
    } else {
      const sequelizeType = `INTEGER()${suffix}`;
      return { sequelizeType, valueType };
    }
  } else if (type.datatype === "decimal") {
    const suffix = unsigned ? ".UNSIGNED" : "";
    const valueType = DECIMAL_AS_STRING ? "string" : "number";
    const sequelizeType = `DECIMAL(${type.digits},${type.decimals})${suffix}`;
    return { sequelizeType, valueType };
  } else if (type.datatype === "float") {
    const suffix = unsigned ? ".UNSIGNED" : "";
    const valueType = "number";
    const sequelizeType = `FLOAT()${suffix}`;
    return { valueType, sequelizeType };
  } else if (type.datatype === "double") {
    const suffix = unsigned ? ".UNSIGNED" : "";
    const valueType = "number";
    const sequelizeType = `DOUBLE()${suffix}`;
    return { valueType, sequelizeType };
  } else if (type.datatype === "char") {
    const valueType = "string";
    const sequelizeType = `CHAR(${type.length})`;
    return { valueType, sequelizeType };
  } else if (type.datatype === "varchar") {
    const valueType = "string";
    const sequelizeType = `STRING(${type.length})`;
    return { valueType, sequelizeType };
  } else if (type.datatype === "text") {
    const valueType = "string";
    const sequelizeType = "TEXT()";
    return { valueType, sequelizeType };
  } else if (type.datatype === "datetime") {
    const valueType = "Date";
    const sequelizeType = "DATE()";
    return { valueType, sequelizeType };
  } else if (type.datatype === "date") {
    const valueType = "Date";
    const sequelizeType = "DATEONLY()";
    return { valueType, sequelizeType };
  } else if (type.datatype === "timestamp") {
    const valueType = "Date";
    const sequelizeType = "DATE()";
    return { valueType, sequelizeType };
  } else if (type.datatype === "json") {
    const valueType = "any";
    const sequelizeType = "JSON";
    return { valueType, sequelizeType };
  }
}
