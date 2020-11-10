const fs = require("fs");
const path = require("path");
const { Parser } = require("sql-ddl-to-json-schema");

const DECIMAL_AS_STRING = true;

const [dbFile, outputDir] = process.argv.slice(2);
if (!dbFile || !outputDir) {
  console.log("Usage: node ./update-models.js <dbfile> <output>");
  console.log("  e.g. node ./scripts/update-models.js db.sql src/models");
  process.exit();
}

const regionMarks = {
  beginInterfaceAttrs: `${spaces(2)}// AutoGenIntefaceAttrBegin {`,
  endInterfaceAttrs: `${spaces(2)}// } AutoGenIntefaceAttrEnd`,
  beginModelAttrs: `${spaces(2)}// AutoGenModelAttrsBegin {`,
  endModelAttrs: `${spaces(2)}// } AutoGenModelAttrsEnd`,
  beginColumnDefs: `${spaces(8)}// AutoGenColumnDefsBegin {`,
  endColumnDefs: `${spaces(8)}// } AutoGenColumnDefsEnd`,
};

const content = fs.readFileSync(dbFile, "utf8");
const parser = new Parser("mysql");
let tables = parser.feed(content).toCompactJson();
tables = tables.map(pruneTable);

fs.writeFileSync(absolutePath("index.ts"), toIndex(tables), "utf8");
tables.forEach(table => {
  const filePath = absolutePath(`${table.name}.ts`);
  if (fs.existsSync(absolutePath(filePath))) {
    const content = fs.readFileSync(filePath, "utf8");
    fs.writeFileSync(filePath, updateModel(table, content), "utf8");
  } else {
    fs.writeFileSync(filePath, toModel(table), "utf8");
  }
});

function absolutePath(fileName) {
  return path.resolve(outputDir, fileName);
}

function toIndex(tables) {
  let importModels = "";
  let exportModels = "";
  let bootModels = "";
  tables.forEach(({ name }) => {
    importModels += `import ${name} from "./${name}";\n`;
    bootModels += `  ${name}.bootstrap(sequelize);\n`;
    exportModels += `  ${name},\n`;
  });
  return `import { Sequelize } from "sequelize";

${importModels}
export function load(sequelize: Sequelize) {
${bootModels}}

export {
${exportModels}};
`;
}

function updateModel(table, content) {
  const beginInterfaceAttrs = content.indexOf(regionMarks.beginInterfaceAttrs);
  const endInterfaceAttrs = content.indexOf(regionMarks.endInterfaceAttrs);
  if (beginInterfaceAttrs > -1 && endInterfaceAttrs > -1) {
    content = content.slice(0, beginInterfaceAttrs) +
      regionMarks.beginInterfaceAttrs + "\n" +
      createInterfaceAttrs(table.columns) + content.slice(endInterfaceAttrs);
  }
  const beginModelAttrs = content.indexOf(regionMarks.beginModelAttrs);
  const endModelAttrs = content.indexOf(regionMarks.endModelAttrs);
  if (beginModelAttrs > -1 && endModelAttrs > -1) {
    content = content.slice(0, beginModelAttrs) +
      regionMarks.beginModelAttrs + "\n" +
      createModelAttrs(table.columns) + content.slice(endModelAttrs);
  }
  const beginColumnDefs = content.indexOf(regionMarks.beginColumnDefs);
  const endColumnDefs = content.indexOf(regionMarks.endColumnDefs);
  if (beginColumnDefs > -1 && endColumnDefs > -1) {
    content = content.slice(0, beginColumnDefs) +
      regionMarks.beginColumnDefs + "\n" +
      createColumnDefs(table.columns) + content.slice(endColumnDefs);
  }
  return content;
}

function toModel(table) {
  const { name, columns } = table;
  return `import { Sequelize, Model, DataTypes, NOW } from "sequelize";

interface ${name}Attributes {
${regionMarks.beginInterfaceAttrs}
${createInterfaceAttrs(columns)}${regionMarks.endInterfaceAttrs}\n}

export default class ${name} extends Model<${name}Attributes, Partial<${name}Attributes>> {
${regionMarks.beginModelAttrs}
${createModelAttrs(columns)}${regionMarks.endModelAttrs}

  public static bootstrap(sequelize: Sequelize) {
    ${name}.init(
      {
${regionMarks.beginColumnDefs}
${createColumnDefs(columns)}${regionMarks.endColumnDefs}
${spaces(6)}},
      {
        sequelize,
        tableName: "${name}",
        timestamps: false,
      },
    );
  }
}
`;
}

function createInterfaceAttrs(columns) {
  let interfaceAttrs = "";
  columns.forEach(col => {
    const {
      colName,
      valueType,
      allowNull,
      defaultValue,
    } = col;
    const optional = !allowNull && typeof defaultValue === "undefined" ? "" : "?";
    interfaceAttrs += `  ${colName}${optional}: ${valueType};\n`;
  });
  return interfaceAttrs;
}

function createModelAttrs(columns) {
  let modelAttrs = "";
  columns.forEach(col => {
    const {
      colName,
      valueType,
      allowNull,
      defaultValue,
    } = col;
    const nonNull = !allowNull && typeof defaultValue === "undefined" ? "!" : "";
    modelAttrs += `  public ${colName}${nonNull}: ${valueType};\n`;
  });
  return modelAttrs;
}

function createColumnDefs(columns) {
  let columnDefs = "";
  columns.forEach(col => {
    const {
      colName,
      sequelizeType,
      allowNull,
      autoIncrement,
      defaultValue,
      primaryKey,
    } = col;
    columnDefs += `${spaces(8)}${colName}: {
${spaces(10)}type: DataTypes.${sequelizeType},\n`;
    if (autoIncrement) {
      columnDefs += `${spaces(10)}autoIncrement: true,\n`;
    }
    if (primaryKey) {
      columnDefs += `${spaces(10)}primaryKey: true,\n`;
    }
    if (!primaryKey && !allowNull) {
      columnDefs += `${spaces(10)}allowNull: false,\n`;
    }
    if (defaultValue) {
      columnDefs += `${spaces(10)}defaultValue: ${defaultValue},\n`;
    }
    columnDefs += `${spaces(8)}},\n`;
  });
  return columnDefs;
}

function spaces(n) {
  return " ".repeat(n);
}

function pruneTable(table) {
  const name = table.name;
  const columns = table.columns.map(col => {
    const { sequelizeType, valueType } = getType(col.type, col.options.unsigned);
    let defaultValue;
    if (col.options.default) {
      if (col.options.default === "CURRENT_TIMESTAMP") {
        defaultValue = "NOW";
      } else {
        defaultValue = col.options.default;
      }
    }
    return {
      colName: col.name,
      sequelizeType,
      valueType,
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
  }
}
