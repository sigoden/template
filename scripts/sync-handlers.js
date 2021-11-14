require("ts-node").register();
require("../src/bootstrap");

const fs = require("fs");
const path = require("path");

const { pascalCase } = require("change-case");
const _ = require("lodash");
const { parse } = require("jsona-openapi-js");

const METHODS = ["get", "put", "delete", "post", "options"];

const [jsonaFile, handlersName] = process.argv.slice(2);
if (!jsonaFile || !handlersName) {
  console.log("Usage: node ./sync-handlers.js <jsona-file> <handlers-name>");
  process.exit();
}

const handlers = require(path.join(__dirname, "../src", handlersName));
const content = fs.readFileSync(jsonaFile, "utf8");
const openapi = parse(content);
const operationIds = getOperationIds(openapi);
const api = path.basename(jsonaFile, ".jsona");
const missOperationIds = _.difference(operationIds, _.keys(handlers));
let todoContent = `import { Handler, ${api} } from "@/type";\n`;
todoContent += missOperationIds.map((id) => toOperation(id)).join("");

fs.writeFileSync(
  path.join(__dirname, "../src", handlersName, "__todo__.ts"),
  todoContent,
  "utf8"
);

function toOperation(operationId) {
  return `\nexport const ${operationId}: Handler<${api}.${pascalCase(
    operationId
  )}Req> = async (req, ctx) => {
  ctx.body = "TO IMPLEMENTED";
};\n`;
}

function getOperationIds(spec) {
  const result = [];
  for (const path in spec.paths) {
    const pathItem = spec.paths[path];
    for (const method of METHODS) {
      const operation = pathItem[method];
      if (operation) {
        result.push(operation.operationId);
      }
    }
  }
  return result;
}
