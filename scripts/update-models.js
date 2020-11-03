const fs = require("fs");
const path = require("path");
const { Parser } = require("sql-ddl-to-json-schema");

const [dbFile, outputDir] = process.argv.slice(2);
if (!dbFile || !outputDir) {
  console.log(`Usage: node ./update-models.js <dbfile> <output>`)
  console.log(`  e.g. node ./scripts/update-models.js db.sql src/models`)
  process.exit();
}

const content = fs.readFileSync(dbFile, "utf8");
const parser = new Parser("mysql");
let tables = parser.feed(content).toCompactJson();
tables = tables.map(pruneTable);
writeToFile("index.ts", toIndex(tables));
tables.forEach(table => {
  writeToFile(`${table.name}.ts`, toModel(table));
});


function writeToFile(fileName, content) {
  fs.writeFileSync(path.resolve(outputDir, fileName), content, "utf8");
}

function toIndex(tables) {
  let importModels = "";
  let constModels = "";
  tables.map(({ name }) => {
    importModels += `import ${name} from "./${name}";\n`
    constModels += `  ${name},\n`
  });
  return `import { Sequelize } from "sequelize";
${importModels}

export const Models = {
${constModels}};

export async function load(sequelize: Sequelize) {
  await Promise.all(Object.keys(Models).map(name => Models[name].bootstrap(sequelize)));
  return Models;
}
`
}

function toModel(table) {
  const { name, columns } = table;
  let modelAttr = "";
  let columnDefs = "";
  columns.forEach(col => {
    const {
      colName,
      sequelizeType,
      valueType,
      allowNull,
      autoIncrement,
      defaultValue,
      primaryKey,
    } = col;
    const nonNull = !allowNull && typeof defaultValue === "undefined" ? "!" : "";
    modelAttr = `  public ${colName}${nonNull}: ${valueType};\n`
    columnDefs += `${spaces(8)}${colName}: {
${spaces(10)}type: DataTypes.${sequelizeType},\n`;
    if (autoIncrement) {
      columnDefs += `${spaces(10)}autoIncrement: true,\n`;
    }
    if (primaryKey) {
      columnDefs += `${spaces(10)}primaryKey: false,\n`;
    }
    if (!primaryKey && !allowNull) {
      columnDefs += `${spaces(10)}allowNull: false,\n`;
    }
    if (defaultValue) {
      columnDefs += `${spaces(10)}defaultValue: ${defaultValue},\n`;
    }
    columnDefs += `${spaces(8)}},\n`
  });

  return `import { Sequelize, Model, DataTypes, NOW } from "sequelize";

export default class ${name} extends Model {

${modelAttr}
  public static bootstrap(sequelize: Sequelize) {
    ${name}.init(
      {
${columnDefs}${spaces(6)}},
      {
        sequelize,
        tableName: "${name}",
        timestamps: false,
      }
    );
  }
}
`
}

function spaces(n) {
  return " ".repeat(n);
}

function pruneTable(table) {
  const name = table.name;
  const columns = table.columns.map(col => {
    const { sequelizeType, valueType } = getType(col.type, col.options.unsigned);
    return {
      colName: col.name,
      sequelizeType,
      valueType,
      allowNull: col.options.nullable,
      autoIncrement: !!col.options.autoincrement,
      defaultValue: !!col.options.default,
      primaryKey: !!table.primaryKey.columns.find(v => v.column == name)
    };
  });
  return { name, columns };
}

function getType(type, unsigned) {
  if (type.datatype === "int") {
    let suffix = unsigned ? ".UNSIGNED" : ""
    let valueType = "number";
    if (type.width === 1) {
      let sequelizeType = `TINYINT()${suffix}`;
      return { sequelizeType, valueType };
    } else if (type.width === 8) {
      let sequelizeType = `BIGINT()${suffix}`;
      return { sequelizeType, valueType };
    } else {
      let sequelizeType = `INTEGER()${suffix}`;
      return { sequelizeType, valueType };
    }
  } else if (type.datatype === "decimal") {
    let suffix = unsigned ? ".UNSIGNED" : ""
    let valueType = "number";
    let sequelizeType = `DECIMAL(${type.digits},${type.decimals})${suffix}`;
    return { sequelizeType, valueType };
  } else if (type.datatype === "float") {
    let suffix = unsigned ? ".UNSIGNED" : ""
    let valueType = "number";
    let sequelizeType = `FLOAT()${suffix}`;
    return { valueType, sequelizeType };
  } else if (type.datatype === "double") {
    let suffix = unsigned ? ".UNSIGNED" : ""
    let valueType = "number";
    let sequelizeType = `DOUBLE()${suffix}`;
    return { valueType, sequelizeType };
  } else if (type.datatype === "char") {
    let valueType = "string";
    let sequelizeType = `CHAR(${type.length})`;
    return { valueType, sequelizeType };
  } else if (type.datatype === "varchar") {
    let valueType = "string";
    let sequelizeType = `STRING(${type.length})`;
    return { valueType, sequelizeType };
  } else if (type.datatype === "text") {
    let valueType = "string";
    let sequelizeType = `TEXT()`;
    return { valueType, sequelizeType };
  } else if (type.datatype === "datetime") {
    let valueType = "Date";
    let sequelizeType = `DATE()`;
    return { valueType, sequelizeType };
  } else if (type.datatype === "date") {
    let valueType = "Date";
    let sequelizeType = `DATEONLY()`;
    return { valueType, sequelizeType };
  } else if (type.datatype === "timestamp") {
    let valueType = "Date";
    let sequelizeType = `DATE()`;
    return { valueType, sequelizeType };
  }
}
