const fs = require("fs");
const path = require("path");
const { Parser } = require("sql-ddl-to-json-schema");

const DECIMAL_AS_STRING = true;

const [dbFile, outputDir] = process.argv.slice(2);
if (!dbFile || !outputDir) {
  console.log("Usage: node ./sync-models.js <dbfile> <output>");
  console.log("  e.g. node ./scripts/sync-models.js db.sql src/models");
  process.exit();
}

const indexRegionMarks = {
  beginImport: "// AutoGenImportBegin {",
  endImport: "// } AutoGenImportEnd",
  beginBootstrap: `${spaces(2)}// AutoGenBootstrapBegin {`,
  endBootstrap: `${spaces(2)}// } AutoGenBootstrapEnd`,
  beginExport: `${spaces(2)}// AutoGenExportBegin {`,
  endExport: `${spaces(2)}// } AutoGenExportEnd`,
};

const modelRegionMarks = {
  beginInterfaceAttrs: `${spaces(2)}// AutoGenIntefaceAttrBegin {`,
  endInterfaceAttrs: `${spaces(2)}// } AutoGenIntefaceAttrEnd`,
  beginModelAttrs: `${spaces(2)}// AutoGenModelAttrsBegin {`,
  endModelAttrs: `${spaces(2)}// } AutoGenModelAttrsEnd`,
  beginColumnDefs: `${spaces(8)}// AutoGenColumnDefsBegin {`,
  endColumnDefs: `${spaces(8)}// } AutoGenColumnDefsEnd`,
};

const content = fs.readFileSync(dbFile, "utf8");
const parser = new Parser("mysql");
let tables;
try {
  tables = parser.feed(content).toCompactJson();
  tables = tables.map(pruneTable);
} catch (err) {
  let msg;
  if (err.message.indexOf("Syntax error") > -1) {
    msg = err.message.split("\n").slice(0, 4).join("\n");
  } else {
    msg = err.message;
  }
  console.log(msg);
  process.exit(1);
}

const indexPath = absolutePath("index.ts");
if (fs.existsSync(indexPath)) {
  const content = fs.readFileSync(indexPath, "utf8");
  fs.writeFileSync(indexPath, updateIndex(tables, content), "utf8");
} else {
  fs.writeFileSync(indexPath, toIndex(tables), "utf8");
}

tables.forEach((table) => {
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
  const { importModels, exportModels, bootModels } = createIndexPairs(tables);
  return `import { Sequelize } from "sequelize";

${indexRegionMarks.beginImport}
${importModels}
${indexRegionMarks.endImport}

export function load(sequelize: Sequelize) {
${indexRegionMarks.beginBootstrap}
${bootModels}
${indexRegionMarks.endBootstrap}
}

export {
${indexRegionMarks.beginExport}
${exportModels}
${indexRegionMarks.endExport}
};
`;
}

function updateIndex(tables, content) {
  const { importModels, exportModels, bootModels } = createIndexPairs(tables);
  const beginImport = content.indexOf(indexRegionMarks.beginImport);
  const endImport = content.indexOf(indexRegionMarks.endImport);
  if (beginImport > -1 && endImport > -1) {
    content =
      content.slice(0, beginImport) +
      indexRegionMarks.beginImport +
      "\n" +
      importModels +
      "\n" +
      content.slice(endImport);
  }

  const beginBootstrap = content.indexOf(indexRegionMarks.beginBootstrap);
  const endBootstrap = content.indexOf(indexRegionMarks.endBootstrap);
  if (beginBootstrap > -1 && endBootstrap > -1) {
    content =
      content.slice(0, beginBootstrap) +
      indexRegionMarks.beginBootstrap +
      "\n" +
      bootModels +
      "\n" +
      content.slice(endBootstrap);
  }

  const beginExport = content.indexOf(indexRegionMarks.beginExport);
  const endExport = content.indexOf(indexRegionMarks.endExport);
  if (beginExport > -1 && endExport > -1) {
    content =
      content.slice(0, beginExport) +
      indexRegionMarks.beginExport +
      "\n" +
      exportModels +
      "\n" +
      content.slice(endExport);
  }

  return content;
}

function createIndexPairs(tables) {
  const importModels = [];
  const exportModels = [];
  const bootModels = [];
  tables.forEach(({ name }) => {
    importModels.push(
      `import ${name}, { ${name}Attributes } from "./${name}";`
    );
    bootModels.push(`  ${name}.bootstrap(sequelize);`);
    exportModels.push(`  ${name},`);
    exportModels.push(`  ${name}Attributes,`);
  });
  return {
    importModels: importModels.join("\n"),
    exportModels: exportModels.join("\n"),
    bootModels: bootModels.join("\n"),
  };
}

function updateModel(table, content) {
  const beginInterfaceAttrs = content.indexOf(
    modelRegionMarks.beginInterfaceAttrs
  );
  const endInterfaceAttrs = content.indexOf(modelRegionMarks.endInterfaceAttrs);
  if (beginInterfaceAttrs > -1 && endInterfaceAttrs > -1) {
    content =
      content.slice(0, beginInterfaceAttrs) +
      modelRegionMarks.beginInterfaceAttrs +
      "\n" +
      createInterfaceAttrs(table.columns) +
      content.slice(endInterfaceAttrs);
  }
  const beginModelAttrs = content.indexOf(modelRegionMarks.beginModelAttrs);
  const endModelAttrs = content.indexOf(modelRegionMarks.endModelAttrs);
  if (beginModelAttrs > -1 && endModelAttrs > -1) {
    content =
      content.slice(0, beginModelAttrs) +
      modelRegionMarks.beginModelAttrs +
      "\n" +
      createModelAttrs(table.columns) +
      content.slice(endModelAttrs);
  }
  const beginColumnDefs = content.indexOf(modelRegionMarks.beginColumnDefs);
  const endColumnDefs = content.indexOf(modelRegionMarks.endColumnDefs);
  if (beginColumnDefs > -1 && endColumnDefs > -1) {
    content =
      content.slice(0, beginColumnDefs) +
      modelRegionMarks.beginColumnDefs +
      "\n" +
      createColumnDefs(table.columns) +
      content.slice(endColumnDefs);
  }
  return content;
}

function toModel(table) {
  const { name, columns } = table;
  return `import { Sequelize, Model, DataTypes, NOW } from "sequelize";

export interface ${name}Attributes {
${modelRegionMarks.beginInterfaceAttrs}
${createInterfaceAttrs(columns)}${modelRegionMarks.endInterfaceAttrs}\n}

export default class ${name} extends Model<${name}Attributes, Partial<${name}Attributes>> {
${modelRegionMarks.beginModelAttrs}
${createModelAttrs(columns)}${modelRegionMarks.endModelAttrs}

  public static bootstrap(sequelize: Sequelize) {
    ${name}.init(
      {
${modelRegionMarks.beginColumnDefs}
${createColumnDefs(columns)}${modelRegionMarks.endColumnDefs}
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
  columns.forEach((col) => {
    const { colName, valueType } = col;
    interfaceAttrs += `  ${colName}${
      isRequired(col) ? "" : "?"
    }: ${valueType};\n`;
  });
  return interfaceAttrs;
}

function createModelAttrs(columns) {
  let modelAttrs = "";
  columns.forEach((col) => {
    const { colName, valueType } = col;
    modelAttrs += `  public ${colName}${
      isRequired(col) ? "!" : ""
    }: ${valueType};\n`;
  });
  return modelAttrs;
}

function isRequired(column) {
  const { allowNull, defaultValue, autoIncrement } = column;
  return !allowNull && typeof defaultValue === "undefined" && !autoIncrement;
}

function createColumnDefs(columns) {
  let columnDefs = "";
  columns.forEach((col) => {
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
    if (typeof defaultValue !== "undefined") {
      if (defaultValue === "") {
        columnDefs += `${spaces(10)}defaultValue: "",\n`;
      } else {
        columnDefs += `${spaces(10)}defaultValue: ${defaultValue},\n`;
      }
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
  const columns = table.columns.map((col) => {
    const { sequelizeType, valueType } = getType(
      col.type,
      col.options.unsigned
    );
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
      sequelizeType,
      valueType,
      allowNull: col.options.nullable,
      autoIncrement: !!col.options.autoincrement,
      defaultValue,
      primaryKey: !!table.primaryKey.columns.find((v) => v.column === col.name),
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
    const sequelizeType = `DECIMAL(${type.digits}, ${type.decimals})${suffix}`;
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
